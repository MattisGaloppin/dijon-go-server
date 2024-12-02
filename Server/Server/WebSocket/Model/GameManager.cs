﻿using System;
using WebSocket.Model.DAO;
using WebSocket.Model.DTO;

namespace WebSocket.Model
{
    /// <summary>
    /// Gère les opérations liées aux parties
    /// </summary>
    public class GameManager
    {
        private IUserDAO userDAO;
        private const int K = 32; // Facteur K pour les calculs Elo

        public GameManager()
        {
            this.userDAO = new UserDAO();
        }

        /// <summary>
        /// Récupère un utilisateur à partir de son token
        /// </summary>
        /// <param name="token">Token du joueur</param>
        /// <returns>L'utilisateur jouant la partie sous forme de GameUserDTO</returns>
        public GameUserDTO GetUserByToken(string token)
        {
            return userDAO.GetUserByToken(token);
        }

        /// <summary>
        /// Modifie l'Elo des deux joueurs en fonction du résultat et de leur différence de niveau
        /// </summary>
        /// <param name="winner">L'utilisateur ayant gagné la partie</param>
        /// <param name="looser">L'utilisateur ayant perdu la partie</param>
        public void UpdateEloWinnerLooser(GameUserDTO winner, GameUserDTO looser)
        {
            int initialWinnerElo = winner.Elo;
            int initialLooserElo = looser.Elo;

            // Calcul des nouveaux Elo
            int newWinnerElo = CalculateNewElo(initialWinnerElo, initialLooserElo, 1); // Resultat 1 : le gagnant
            int newLooserElo = CalculateNewElo(initialLooserElo, initialWinnerElo, 0); // Resultat 0 : le perdant

            // Mise à jour des Elo dans la base de données
            this.userDAO.UpdateEloByToken(winner.Token, newWinnerElo);
            this.userDAO.UpdateEloByToken(looser.Token, newLooserElo);
        }

        /// <summary>
        /// Calcule le nouvel Elo d'un joueur
        /// </summary>
        /// <param name="playerElo">Elo actuel du joueur</param>
        /// <param name="opponentElo">Elo de l'adversaire</param>
        /// <param name="result">Résultat du match (1 pour victoire, 0 pour défaite)</param>
        /// <returns>Le nouvel Elo du joueur</returns>
        public int CalculateNewElo(int playerElo, int opponentElo, int result)
        {
            // Calcul de la probabilité de victoire
            double expectedScore = 1.0 / (1.0 + Math.Pow(10, (opponentElo - playerElo) / 400.0));

            // Calcul du nouvel Elo
            return (int)(playerElo + K * (result - expectedScore));
        }
    }
}
