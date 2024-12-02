﻿using Server.Model.Data;
using WebSocket.Model;

namespace Tests.Users
{
    public class LeaderboardUserTest
    {

        private IUserDAO fakeUserDAO;
        private GameManager gameManager;
        public LeaderboardUserTest()
        {
            fakeUserDAO = new FakeUserDAO();
            gameManager = new GameManager();
        }
        // Test de la méthode GetTop5Users
        [Fact]
        public void GetTop5Users_ReturnsTop5UsersSortedByElo()
        {
            // Act: Récupérer le top 5 des utilisateurs
            var top5Users = fakeUserDAO.GetTop5Users();

            // Assert: Vérifier que les utilisateurs sont triés par Elo décroissant et qu'il y a 5 utilisateurs
            Assert.Equal(5, top5Users.Count);
            Assert.Equal("Alice", top5Users.ElementAt(0).Key); // Le plus haut Elo doit être Alice
            Assert.Equal(2000, top5Users.ElementAt(0).Value);  // Elo de Alice

            Assert.Equal("Bob", top5Users.ElementAt(1).Key);
            Assert.Equal(1800, top5Users.ElementAt(1).Value);

            Assert.Equal("Charlie", top5Users.ElementAt(2).Key);
            Assert.Equal(1500, top5Users.ElementAt(2).Value);

            Assert.Equal("victor", top5Users.ElementAt(3).Key);
            Assert.Equal(100, top5Users.ElementAt(3).Value);

            Assert.Equal("user2", top5Users.ElementAt(4).Key);
            Assert.Equal(100, top5Users.ElementAt(4).Value);
        }

        // Test que le gagnant a un Elo supérieur après la victoire
        [Fact]
        public void TestCalculEloWinGame()
        {
            // Arrange
            int playerElo = 1500;    // Elo du joueur
            int opponentElo = 1400;  // Elo de l'adversaire
            int result = 1;          // victoire du joueur

            int newPlayerElo = this.gameManager.CalculateNewElo(playerElo, opponentElo, result);

            //verifie que le joueur qui a gagné voit son elo augmenter
            Assert.True(newPlayerElo > playerElo);
        }

        // Test que le perdant a un Elo inférieur après la défaite
        [Fact]
        public void TestCalculEloLooseGame()
        {
            // Arrange
            int playerElo = 1500;    // elo du joueur
            int opponentElo = 1600;  // elo de l'adversaire
            int result = 0;          // defaite du joueur

            int newPlayerElo = this.gameManager.CalculateNewElo(playerElo, opponentElo, result);

            // verifie si l'elo du perdant a diminuer
            Assert.True(newPlayerElo < playerElo);
        }


    }
}
