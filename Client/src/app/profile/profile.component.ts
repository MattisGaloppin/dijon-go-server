import { Component } from '@angular/core';
import  {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileSettingsComponent } from '../profile-settings/profile-settings.component';
import { MatDialog } from '@angular/material/dialog';
import { UserCookieService } from '../Model/UserCookieService';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule,MatButtonModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

/**
 * Composant de la page de profil
 */
export class ProfileComponent {
  private token: string;
  private userPseudo: string;
  private userEmail: string;
  private rank: string;
  private avatar: string;
  private elo: number;

  /**
 * Getter pour l'affichage de l'elo
 */
  public get Elo(): number
  {
    return this.elo;
  }

  public get Avatar(): string {
    return this.avatar;
  }
  public get UserPseudo(): string {
    return this.userPseudo;
  }

  public get UserEmail(): string {
    return this.userEmail;
  }

  public get Rank(): string {
    return this.rank;
  }

    /**
   * Le constructeur initialise le composant en récupérant le jeton utilisateur, 
   * en vérifiant son authenticité, et en récupérant les informations de l'utilisateur 
   * à partir des cookies. Si le jeton n'est pas valide, l'utilisateur est redirigé vers 
   * la page de connexion.
   * */
  constructor(public dialog: MatDialog, private userCookieService: UserCookieService, private router: Router, private http: HttpClient) {
    // Récupère le token utilisateur
    this.token = this.userCookieService.getToken();
    //verfication du token utilisateur sinon redirection login
    if(!this.token)
    {
        this.router.navigate(['/login']);
    }

    //recuperation de l'image de l'utilisateur à partir de son pseudo
    this.userPseudo = this.userCookieService.getUser().Username;
    this.userEmail = this.userCookieService.getUser().Email;
    this.rank = this.userCookieService.getUser().Rank;
    this.elo = this.userCookieService.getUser().Elo;
    this.avatar = 'https://localhost:7065/profile-pics/' + this.userPseudo            
  }

  /**
   * Ouvre une popup profile settings pour modifier son profile 
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(ProfileSettingsComponent, {
      width: '80%',
      height: '85%',
      panelClass: 'custom-dialog-container'
    });
    dialogRef.afterClosed().subscribe(result => {
       
    });
  }
  
}



