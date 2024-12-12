import { IStrategy } from './IStrategy';
import { Game } from '../Model/Game';
import { MatchmakingPopupDisplayer } from '../MatchmakingPopupDisplayer';

/**
 * Implémentation de la stratégie de timeout
 */
export class TimeoutStrategy implements IStrategy {

    private popUpDisdaplayer: MatchmakingPopupDisplayer;

    public constructor() {
        this.popUpDisdaplayer = new MatchmakingPopupDisplayer();
    }
    public execute(data: string[], state: { end: boolean, won: string, player1score: string, player2score: string}, idGame: {value: string}, game:Game):void {
       this.popUpDisdaplayer.displayTimeOutPopup();
    }
}
