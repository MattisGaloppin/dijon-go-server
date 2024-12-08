import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { WebsocketService } from '../websocket.service';
import { UserCookieService } from '../Model/UserCookieService';
import { CdTimerModule } from 'angular-cd-timer';
import { ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { IObserver } from '../Observer/IObserver';
import { Observable } from '../Observer/Observable';
import { Game } from '../Model/Game';
import { environment } from '../environment';


const PROFILE_PIC_URL = environment.apiUrl + '/profile-pics/';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [NgFor, NgIf, MatIconModule, CdTimerModule],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css',
})



/**
 * Composant de la grille de jeu
 */
export class GridComponent implements AfterViewInit, OnInit, IObserver, OnDestroy {
  private size: number;
  private rule: string;
  private playerAvatar: string;
  private playerPseudo: string;
  private game: Game;

  public update(object: Observable): void {
    this.game = object as Game;
    let playerTimerContainer = document.getElementById('player-timer');
    let opponentTimerContainer = document.getElementById('opponent-timer');
    if(playerTimerContainer != undefined && opponentTimerContainer != undefined){
      this.updateTimers(playerTimerContainer, opponentTimerContainer);
    }
    let globalContainer = document.getElementById('global-container');
    if(globalContainer != undefined){
      this.updateHover(globalContainer);
      this.updateBoard();
    }

    let opponentPseudoContainer = document.getElementById('pseudo-text');
    let opponentAvatarContainer = document.getElementById('opponent-pic');
    if(opponentPseudoContainer != undefined && opponentAvatarContainer != undefined){
      this.updateOpponentPseudo(opponentPseudoContainer, opponentAvatarContainer as HTMLImageElement);
    }

    let playerCapturesContainer = document.getElementById('player-score-value');
    let opponentCapturesContainer = document.getElementById('opponent-score-value');
    if(playerCapturesContainer != undefined && opponentCapturesContainer != undefined){
      let captures = this.game.getCaptures();
      if(captures != ""){
        console.log(captures);
        this.updateCaptures(captures, playerCapturesContainer, opponentCapturesContainer);
      }
    }
  }

  private updateOpponentPseudo(opponentPseudoContainer:HTMLElement, opponentAvatarContainer:HTMLImageElement):void{
    let opponentPseudo = this.game.getOpponentPseudo();
    opponentPseudoContainer.innerText = opponentPseudo;
    opponentAvatarContainer.src = `${PROFILE_PIC_URL}${opponentPseudo}`;
  }

  private updateTimers(playerTimerContainer:HTMLElement, opponentTimerContainer:HTMLElement):void{
    let palyerMs = this.game.getPlayerMs();
    let opponentMs = this.game.getOpponentMs();
    let stringPlayerMs = palyerMs.toString();
    let stringOpponentMs = opponentMs.toString();
    let playerTimer = this.msToTimer(stringPlayerMs);
    let opponentTimer = this.msToTimer(stringOpponentMs);
    playerTimerContainer.innerText = playerTimer;
    opponentTimerContainer.innerText = opponentTimer;
  }

  /**
   * Met à jour l'effet de survol des pierres
   */
  private updateHover(container:HTMLElement):void{
    let stones = document.querySelectorAll(".stone, .bigger-stone");
    let stonesArray = Array.from(stones);
    if(this.game.isPlayerTurn()){
      container.style.cursor = "pointer";
      stonesArray.forEach((stone)=>{
        stone.classList.add("active");
      })
    }else{
      container.style.cursor = "not-allowed";
      stonesArray.forEach((stone)=>{
        stone.classList.remove("active");
      })
    }
  }

  /**
   * Trasforme un nombre de ms en un timer
   * @param ms nombre de ms
   * @returns un timer en string
   */
  private msToTimer(ms:string):string{
    let totalMs = Number(ms);
    let totalSeconds = Math.floor(totalMs/1000);
    let minutes = Math.floor(totalSeconds/60);
    let seconds = totalSeconds % 60;
    let stringMiniutes = minutes.toString().padStart(2,'0');
    let stringSeconds = seconds.toString().padStart(2,'0');
    let result = `${stringMiniutes}:${stringSeconds}`;
    return result;
  }

  public get PlayerAvatar() {
    return this.playerAvatar;
  }

  public get PlayerPseudo() {
    return this.playerPseudo;
  }

  public constructor(
    private websocketService: WebsocketService,
    private userCookieService: UserCookieService,
    private route: ActivatedRoute
  ) {
    this.size = 0;
    this.playerPseudo = this.userCookieService.getUser()!.Username; // Récupère le nom d'utilisateur et l'avatar pour l'afficher sur la page

    this.playerAvatar =
      'https://localhost:7065/profile-pics/' + this.playerPseudo;
    this.rule = '';
    this.game = this.websocketService.getGame();
    this.game.register(this);
  }
  ngOnDestroy(): void {
    this.game.endGame();
  }

  /**
   * Renvoie la taille de la grille
   * @returns La taille de la grille
   */
  public getSize(): number {
    return this.size - 1;
  }

  /**
   * Initialisation du composant
   */
  public ngOnInit(): void {
    this.size = Number(this.route.snapshot.paramMap.get('size'));
    this.rule = String(this.route.snapshot.paramMap.get('rule'));
  }

  /**
   * Mise en place des écouteurs d'événements sur les boutons, après l'initialisation complète de la page
   */
  public ngAfterViewInit(): void {
    if (this.size < 13) {
      let cells = document.querySelectorAll('.cell, .cell-bottom');
      let stones = document.getElementsByClassName('stone');
      let arrayCells = Array.from(cells);
      let arrayStones = Array.from(stones);
      arrayCells.forEach((cell) => {
        cell.classList.remove(cell.classList[0]);
        cell.classList.add('bigger-cell');
      });
      arrayStones.forEach((stone) => {
        stone.classList.remove('stone');
        stone.classList.add('bigger-stone');
      });
    }

    let stones = document.querySelectorAll('.stone, .bigger-stone');
    let stonesArray = Array.from(stones);

    stonesArray.forEach((stone) => {
      // Gestion du clic
      stone.addEventListener('click', () => {
        this.click(stone);
      });
    
      // Gestion de la touche "Entrée"
      stone.addEventListener('keydown', (event) => {
        if (event instanceof KeyboardEvent && event.key === 'Enter') {
          this.click(stone);
        }
      });
    });

    this.initializeRulesInfo();

    let passButton = document.getElementById('pass');
    passButton?.addEventListener('click', () => {
      this.skipTurn();
    });
  }

  private initializeRulesInfo(): void {
    let ruleText = document.getElementById('rule-text');
    if (this.rule == 'c') {
      ruleText!.append('chinoises');
    }
    if (this.rule == 'j') {
      ruleText!.append('japonaises');
    }
    let ruleButton = document.getElementById('rule-icon') as HTMLButtonElement;

    ruleButton.addEventListener('click', () => {
      if (this.rule === 'c') {
        Swal.fire({
          title: 'Règles Chinoises',
          html: `
            <p>Le calcul du score final pour les règles chinoises compte les territoires et les pierres posées.</p>
            <a href="https://fr.wikipedia.org/wiki/R%C3%A8gles_du_go#R%C3%A8gle_chinoise" target="_blank" style="color: #007bff;">Plus d'informations</a>
          `,
          icon: 'info',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'custom-ok-button',
          },
        });
      } else if (this.rule === 'j') {
        Swal.fire({
          title: 'Règles Japonaises',
          html: `
            <p>Le calcul du score final pour les règles japonaises compte les territoires et les pierres capturées.</p>
            <a href="https://fr.wikipedia.org/wiki/R%C3%A8gles_du_go#R%C3%A8gle_japonaise" target="_blank" style="color: #007bff;">Plus d'informations</a>
          `,
          icon: 'info',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'custom-ok-button',
          },
        });
      }
    });
  }

  /**
   * Gère le clic ou l'appui sur "Entrée" sur une intersection de la grille
   * @param stone emplacement concerné par l'action
   */
  public click(stone: any): void {
    this.websocketService.placeStone(stone.id);
  }

  /**
   * Gère le clic sur le bouton "Passer", passe le tour du joueur après confirmation
   */
  public skipTurn() {
    Swal.fire({
      title: 'Voulez-vous vraiment passer votre tour ?',
      text: 'Un tour passé peut être synonyme de fin de partie.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      customClass: {
        confirmButton: 'custom-yes-button',
        cancelButton: 'custom-no-button',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Passe le tour du joueur
        this.websocketService.skipTurn();

        // Affiche le message "Tour passé"
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          icon: 'success',
        }).fire({
          title: 'Tour passé',
        });
      }
    });
  }

  private updateBoard() {
    let board = this.game.getBoard();
    let lines = board.split('\r\n');
    const colorMap: { [key: string]: string } = {
        'White': 'white',
        'Black': 'black',
        'Empty': 'transparent'
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

  private discardKo(stone: HTMLElement | null):void{
    if(stone != null){
      stone.style.border = "none";
      stone.style.borderRadius = "50%";
    }

  }

  private drawKo(stone: HTMLElement | null):void{
    stone!.style.borderRadius = "0";
    stone!.style.border = "5px solid #A7001E";
    stone!.style.boxSizing = "border-box";
    stone!.style.background = "transparent";

  }


  private updateCaptures(captures: string, playerCapturesContainer: HTMLElement, opponentCapturesContainer: HTMLElement): void {
    let playerCaptures;
    let opponentCaptures;
    if (this.game.getPlayerColor() == 'black') { 
      playerCaptures = captures.split(';')[1];
      opponentCaptures = captures.split(';')[0];
    } else {
      playerCaptures = captures.split(';')[0];
      opponentCaptures = captures.split(';')[1];
    }

    document.getElementById('opponent-score-value')!.innerHTML =
      'Prises : ' + opponentCaptures;
    document.getElementById('player-score-value')!.innerHTML =
      'Prises : ' + playerCaptures;
}
}
