import { Component } from '@angular/core';
import { GridComponent } from '../grid/grid.component';
import { UserCookieService } from '../Model/UserCookieService';
import { environment } from '../environment';
import { GameDAO } from '../Model/DAO/GameDAO';
import { GameInfoDTO } from '../Model/DTO/GameInfoDTO';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GameStateDTO } from '../Model/DTO/GameStateDTO';
import { firstValueFrom } from 'rxjs';
import { stat } from 'fs';

const PROFILE_PIC_URL = environment.apiUrl + '/profile-pics/';

@Component({
  selector: 'app-replay-screen',
  standalone: true,
  imports: [GridComponent],
  templateUrl: './replay-screen.component.html',
  styleUrl: './replay-screen.component.css',
})
export class ReplayScreenComponent {
  private playerPseudo: string;
  private playerAvatar: string;
  private gameDAO: GameDAO;
  private id: number;

  private stateNumber: number;

  private blackCapturedContainer : HTMLElement | null;
  private whiteCapturedContainer : HTMLElement | null;

  private states: GameStateDTO[];

  constructor(
    private userCookieService: UserCookieService,
    private route: ActivatedRoute,
    private httpClient: HttpClient
  ) {
    this.stateNumber = 0;
    this.gameDAO = new GameDAO(this.httpClient);
    this.playerPseudo = this.userCookieService.getUser()!.Username; // Récupère le nom d'utilisateur et l'avatar pour l'afficher sur la page
    this.playerAvatar = PROFILE_PIC_URL + this.playerPseudo;
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.states = [];
    this.blackCapturedContainer = null;
    this.whiteCapturedContainer = null;
  }

  async ngAfterViewInit(): Promise<void> {
    this.hideGameElements();
    this.displayPlayersInformations();
    
    await this.loadGameStates();
    this.displayState(this.stateNumber);
    document.addEventListener(('keydown'), (event) => {
      switch (event.key) {
        case "ArrowRight": this.nextState();break;
        case "ArrowLeft": this.previousState();break;
        case "Enter": this.moveToState();break;
      }
    });
  }

  private updateCapturedCounters(black:string, white:string):void{
    if(this.blackCapturedContainer != null && this.whiteCapturedContainer != null){
      this.blackCapturedContainer.innerText = "Prises : " + black;  
      this.whiteCapturedContainer.innerText = "Prises : " + white;
    }
  }

  public nextState(): void {
    if (this.stateNumber < this.states.length - 1) {
      this.stateNumber++;
      this.displayState(this.stateNumber);
    }
  }

  public previousState(): void {
    if (this.stateNumber > 0) {
      this.stateNumber--;
      this.displayState(this.stateNumber);
    }
  }

  public moveToState():void{
    let input = document.getElementById('move-number') as HTMLInputElement;
    let moveNumber = Number(input.value)-1;
    this.stateNumber = moveNumber;
    if(moveNumber >= 0 && moveNumber < this.states.length){
      this.stateNumber = moveNumber;
      this.displayState(this.stateNumber);
    }
    input.value = "";
  }

  private displayState(number: number): void {
    let state = this.states[number];
    let blackCaptured = state.CapturedBlack();
    let whiteCaptured = state.CapturedWhite();
    this.updateCapturedCounters(blackCaptured.toString(), whiteCaptured.toString());
    let board = state.Board();
    let lines = board.split('!');
    const colorMap: { [key: string]: string } = {
      White: 'white',
      Black: 'black',
      Empty: 'transparent',
    };

    for (let i = 1; i < lines.length; i++) {
      let stoneData = lines[i].split(',');
      let x = stoneData[0];
      let y = stoneData[1];
      let color = stoneData[2];
      let stone = document.getElementById(`${x}-${y}`);
      this.discardKo(stone);

      if (colorMap[color]) {
        stone!.style.background = colorMap[color];
      } else if (color === 'Ko') {
        this.drawKo(stone);
      }
    }
  }

  private discardKo(stone: HTMLElement | null): void {
    if (stone != null) {
      stone.style.border = 'none';
      stone.style.borderRadius = '50%';
    }
  }

  private drawKo(stone: HTMLElement | null): void {
    stone!.style.borderRadius = '0';
    stone!.style.border = '5px solid #A7001E';
    stone!.style.boxSizing = 'border-box';
    stone!.style.background = 'transparent';
  }

  private async loadGameStates(): Promise<void> {
    const response = await firstValueFrom(
      this.gameDAO.GetGameStatesById(this.id)
    );
    response.forEach((state) => {
      let gameInfo = new GameStateDTO(
        state['board'],
        state['capturedBlack'],
        state['capturedWhite'],
        state['moveNumber']
      );
      this.states.push(gameInfo);
    });
  }

  private displayPlayersInformations(): void {
    let playerPseudoContainer = document.getElementById('player-pseudo-text');
    let playerAvatarContainer = document.getElementById('player-pic') as HTMLImageElement;
    if (
      playerPseudoContainer != undefined &&
      playerAvatarContainer != undefined
    ) {
      playerPseudoContainer.innerText = this.playerPseudo;
      playerAvatarContainer.src = `${PROFILE_PIC_URL}${this.playerPseudo}`;
      this.displayOpponentInformations();
    }
  }

  private displayOpponentInformations(): void {
    this.gameDAO.GetGameById(this.id).subscribe((gameInfo: any) => {
      let opponentPseudoContainer = document.getElementById('pseudo-text');
      let opponentAvatarContainer = document.getElementById('opponent-pic') as HTMLImageElement;
      if (opponentPseudoContainer != undefined && opponentAvatarContainer != undefined) {
        if (this.playerPseudo == gameInfo.usernamePlayer1) {
          console.log(gameInfo.usernamePlayer1);
          opponentPseudoContainer.innerText = gameInfo.usernamePlayer2;
          opponentAvatarContainer.src = `${PROFILE_PIC_URL}${gameInfo.usernamePlayer2}`;
          this.blackCapturedContainer = document.getElementById('player-score-value');
          this.whiteCapturedContainer = document.getElementById('opponent-score-value');
        } else {
          opponentPseudoContainer.innerText = gameInfo.usernamePlayer1;
          opponentAvatarContainer.src = `${PROFILE_PIC_URL}${gameInfo.usernamePlayer1}`;
          this.blackCapturedContainer = document.getElementById('opponent-score-value');
          this.whiteCapturedContainer = document.getElementById('player-score-value');
        }
      }
    });
  }

  private hideGameElements(): void {
    let passButton = document.getElementById('pass');
    let playerTimer = document.getElementById('player-timer');
    let opponentTimer = document.getElementById('opponent-timer');
    let ruleContainer = document.getElementById('rule-container');
    passButton!.style.display = 'none';
    playerTimer!.style.display = 'none';
    opponentTimer!.style.display = 'none';
    ruleContainer!.style.display = 'none';
  }
}
