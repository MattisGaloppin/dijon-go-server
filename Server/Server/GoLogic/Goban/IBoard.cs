﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GoLogic.Goban
{
    /// <summary>
    /// Represents the game board and its operations
    /// </summary>
    public interface IBoard
    {
        /// <summary>
        /// Récupère la taille du plateau
        /// </summary>
        int Size { get; }

        /// <summary>
        /// Tour actuel, Noir ou Blanc
        /// </summary>
        public StoneColor CurrentTurn { get; set; }

        /// <summary>
        /// Pierre noire qui ont été capturée
        /// </summary>
        public int CapturedBlackStones { get; set; }

        /// <summary>
        /// Pierre blanche qui ont été capturée
        /// </summary>
        public int CapturedWhiteStones { get; set; }

        /// <summary>
        /// Gets the stone at the specified coordinates
        /// </summary>
        /// <param name="x">coordonnées X</param>
        /// <param name="y">coordonnées X</param>
        /// <returns>La pierre aux coordoonées spécifié</returns>
        Stone GetStone(int x, int y);

        /// <summary>
        /// Change la couleur de la pierre aux coordonnés spécifié
        /// </summary>
        /// <param name="x">X coordinate</param>
        /// <param name="y">Y coordinate</param>
        /// <param name="color">Couleur de la pierre à placer</param>
        /// <returns>A new board state with the stone placed</returns>
        void PlaceStone(Stone stone, StoneColor color);

        /// <summary>
        /// Vérifie si les coordonnées sont correct
        /// </summary>
        /// <param name="x">coordonnées X</param>
        /// <param name="y">coordonnées Y</param>
        /// <returns>True si les coordonnées sont correct, false sinon</returns>
        bool IsValidCoordinate(int x, int y);

        /// <summary>
        /// Créer une copie complete de IBoard
        /// </summary>
        /// <returns>Une nouvelle instance de IBoard avec les même valeurs</returns>
        IBoard Clone();

        /// <summary>
        /// Récupères les pierres voisines de celle spécifiée
        /// </summary>
        /// <param name="stone">La pierre dont on cherche les voisines</param>
        /// <returns>Liste des pierres voisines</returns>
        public List<Stone> GetNeighbors(Stone stone);

        /// <summary>
        /// Vérifie si l'état actuel du plateau correspond à l'état précédent (règle de Ko).
        /// Pour éviter que le jeu tourne en boucle
        /// </summary>
        /// <returns>Vraie si le coup ne respecte pas la règle, faux sinon</returns>
        public bool IsKoViolation();
    }
}
