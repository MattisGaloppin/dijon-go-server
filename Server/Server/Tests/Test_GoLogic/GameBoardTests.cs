﻿using Go_logic_csharp;

namespace Test_GoLogic
{
    public class GameBoardTests
    {
        [Fact]
        public void GameBoard_Initialization_EmptyStones()
        {
            // Organise
            int size = 9;
            var gameBoard = new GameBoard(size);

            // Fait & Assert
            Assert.Equal(size, gameBoard.Size);
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    Assert.Equal(StoneColor.Empty, gameBoard.Board[i, j].Color);
                }
            }
        }

        [Fact]
        public void GetStone_ValidCoordinates_ReturnsStone()
        {
            // Organise
            var gameBoard = new GameBoard(9);

            // Fait
            var stone = gameBoard.GetStone(0, 0);

            // Assert
            Assert.NotNull(stone);
            Assert.Equal(0, stone.X);
            Assert.Equal(0, stone.Y);
        }

        [Fact]
        public void GetStone_InvalidCoordinates_ThrowsException()
        {
            // Organise
            var gameBoard = new GameBoard(9);

            // Fait & Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => gameBoard.GetStone(10, 10));
        }

        [Fact]
        public void IsValidCoordinate_WithinBounds_ReturnsTrue()
        {
            // Organise
            var gameBoard = new GameBoard(9);

            // Fait & Assert
            Assert.True(gameBoard.IsValidCoordinate(0, 0));
            Assert.False(gameBoard.IsValidCoordinate(9, 9)); // Outside of bounds
        }

        [Fact]
        public void CopieBoard_copieCorrectly()
        {
            var gameBoard = new GameBoard(9);
            gameBoard.Board[0,0].Color = StoneColor.White;
            gameBoard.Board[1,1].Color = StoneColor.Black;

            gameBoard.CopieBoard();

            Assert.Equal(StoneColor.White, gameBoard.PreviousBoard[0, 0].Color);
            Assert.Equal(StoneColor.Black, gameBoard.PreviousBoard[1, 1].Color);
        }
    }
}
