import { AfterViewInit, Component, OnInit, OnDestroy,ViewChild, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridComponent } from './grid/grid.component';
import { RegisterComponent } from './register/register.component';  
import { UploadImageComponent } from './upload-image/upload-image.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ConnexionComponent } from './connexion/connexion.component';
import { ProfileComponent }  from './profile/profile.component'
import { IndexComponent } from './index/index.component';
import { FooterComponent } from "./footer/footer.component";
import { WebsocketService } from './websocket.service';
import { CommonModule } from '@angular/common';
import { HamburgerBtnComponent } from './hamburger-btn/hamburger-btn.component';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridComponent, RegisterComponent, UploadImageComponent, NavbarComponent, ProfileComponent, ConnexionComponent, IndexComponent, FooterComponent, CommonModule,HamburgerBtnComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'

})
export class AppComponent implements AfterViewInit{

  @ViewChild(NavbarComponent) navbarComponent!: NavbarComponent;

  // Ajout d'une propriété pour gérer la visibilité de la navbar
  private _isNavbarVisible: boolean = false;
  private isBlack: boolean;
  // Getter pour obtenir la visibilité de la navbar
  public get isNavbarVisible(): boolean {
    return this._isNavbarVisible;
  }

  title = 'Client';
  private state: string;

  // Getter pour l'attribut `state`
  getState(): string {
    return this.state;
  }

  // Setter pour l'attribut `state`
  setState(SetState: string): void {
    this.state = SetState;
  }
  

  public constructor(private websocketService:WebsocketService,private cdr: ChangeDetectorRef) {
    this.state = 'light';
    this.checkScreenSize();
    this.isBlack = false;
  }

  
  public ngAfterViewInit(){
    this.connectWebSocket();
  }


  public changeLightState():void{
    if(this.isBlack == false){
      // Mode sombre
      console.log("j'effectue le code css sombre");
      document.body.style.background = "#302E2B";
      document.body.style.color = "white";
      document.getElementById("navbar-container")!.style.setProperty("background", "grey", "important");
      document.getElementById("navbar-container")!.style.setProperty("color", "white", "important");
      Array.from(document.getElementsByClassName("timer")).forEach(timer=>{
        (timer as HTMLDivElement).style.border = "1px solid white";
      });
      (document.getElementById("logo") as HTMLImageElement).src = "renard_dark.png";
      //(document.getElementById("renardRegister") as HTMLImageElement).src = "renard_dark.png";

      // Modification des couleurs des liens du footer
      const footerLinks = document.querySelectorAll("footer a");
      footerLinks.forEach(link => {
          (link as HTMLAnchorElement).style.color = "#989795";
          (link as HTMLAnchorElement).addEventListener("mouseover", () => {
              (link as HTMLAnchorElement).style.color = "white";
          });
          (link as HTMLAnchorElement).addEventListener("mouseout", () => {
              (link as HTMLAnchorElement).style.color = "#989795";
          });

      });
      (<HTMLButtonElement>document.getElementById("state")!).textContent = "Interface claire";
      this.cdr.detectChanges();
      this.isBlack = true;
    }else{
      // Mode Clair
      console.log("j'effectue le code css clair");
      document.body.style.background = "#f5f5f5";
      document.body.style.color = "black";
      document.getElementById("navbar-container")!.style.setProperty("background", "#faf9fd", "important");
      document.getElementById("navbar-container")!.style.setProperty("color", "black", "important");
      Array.from(document.getElementsByClassName("timer")).forEach(timer=>{
        (timer as HTMLDivElement).style.border = "1px solid black";
      });
      (<HTMLButtonElement>document.getElementById("state")!).textContent = "Interface sombre";
      (document.getElementById("logo") as HTMLImageElement).src = "renard.png";

      // Modification des couleurs des liens du footer
      const footerLinks = document.querySelectorAll("footer a");
        footerLinks.forEach(link => {
            (link as HTMLAnchorElement).style.color = "darkgray";
            (link as HTMLAnchorElement).addEventListener("mouseover", () => {
                (link as HTMLAnchorElement).style.color = "black";
            });
            (link as HTMLAnchorElement).addEventListener("mouseout", () => {
                (link as HTMLAnchorElement).style.color = "darkgray";
            });
        });
      //(document.getElementById("renardRegister") as HTMLImageElement).src = "renard.png";
      this.isBlack = false;
    }
    this.cdr.detectChanges();

    
  }

  public connectWebSocket(): void {
    this.websocketService.connectWebsocket();

  }
  
  // Méthode pour basculer la visibilité de la navbar
  public toggleNavbar(): void {
    this._isNavbarVisible = !this._isNavbarVisible;
  }

   // Méthode pour gérer la fermeture de la navbar
   public onCloseNavbar(): void {
    this._isNavbarVisible = false;
  }
  
  // Méthode pour vérifier la taille de l'écran et ajuster la navbar
  private checkScreenSize(): void {
    const screenWidth = window.innerWidth;
    this._isNavbarVisible = screenWidth >= 768;
  }

  // Écouter les changements de taille de l'écran
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  public onThemeChange(states: string): void {
    this.state = states; // Met à jour la propriété state avec la nouvelle valeur
  }

  /**
   * Méthode appelée lorsque l'événement de changement de thème est déclenché.
   * Elle met à jour l'état `isBlack` en fonction de la valeur de l'événement,
   * et applique les changements de style correspondants en appelant `changeLightState`.
   *
   * @param $event - Un booléen indiquant si le thème sombre (true) ou clair (false) est activé.
   */
  public onThemeChangeEvent($event: boolean){
  {
      this.isBlack = $event;
      console.log("Changement de thème :", this.isBlack);
      this.changeLightState();
    }   
   
  }
}