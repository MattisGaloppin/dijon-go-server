﻿using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using WebSocket.Exceptions;
using WebSocket.Model;
using WebSocket.Model.DTO;
using WebSocket.Protocol;


namespace WebSocket
{
    /// <summary>
    /// Classe qui se charge de communiquer avec des clients 
    /// </summary>
    public class Server
    {
        private IWebProtocol webSocket;
        private bool isRunning;
        private bool started;
        private static ConcurrentDictionary<int, Game> games = new ConcurrentDictionary<int, Game>();
        private Interpreter interpreter;
        private GameManager gameManager;
        /// <summary>
        /// Dictionnaire qui contient les parties en cours
        /// </summary>
        public static ConcurrentDictionary<int, Game> Games { get => games; set => games = value; }

        /// <summary>
        /// Constructeur de la classe Server
        /// </summary>
        public Server()
        {
            this.webSocket = new Protocol.WebSocket("127.0.0.1", 7000); //10.211.55.3
            this.gameManager = new GameManager();
        }


        /// <summary>
        /// Démarre l'écoute du serveur 
        /// </summary>
        public void Start()
        {
            this.webSocket.Start();
            this.isRunning = true;
            this.started = false;
            Console.WriteLine("Server Started");

            while (isRunning)
            {
                try
                {
                    Thread thread = new Thread(() =>
                    {
                        TcpClient tcp = this.webSocket.AcceptClient();
                        Client client = new Client(tcp);
                        this.interpreter = new Interpreter();
                        bool endOfCommunication = false;


                        while (!endOfCommunication)
                        {
                            byte[] bytes = client.ReceiveMessage();
                            string message = Encoding.UTF8.GetString(bytes);
                            string response = "";

                            if (this.MessageIsHandshakeRequest(message)) // test si le message reçu est une demande de handshake
                            {
                                this.ProceedHandshake(message, client, ref response);
                            }
                            else // Le message est un message chiffré
                            {
                                try
                                {
                                    this.TreatMessage(bytes, client, ref message, ref response);
                                }
                                catch (DisconnectionException ex) // Le message reçu est un message de déconnexion
                                {
                                    this.DisconnectClient(client, ex, ref endOfCommunication);
                                }
                            }
                            if (!endOfCommunication)
                            {
                                Console.WriteLine($"Received : {message}");
                                Console.WriteLine($"Sent : {response}");
                            }
                        }

                    });
                    thread.Start();

                }
                catch (Exception ex)
                {
                    Console.WriteLine("Erreur: " + ex.Message);
                }
            }
        }

        /// <summary>
        /// Vérifie si le message reçu est une demande de handshake
        /// </summary>
        private bool MessageIsHandshakeRequest(string message)
        {
            return Regex.IsMatch(message, "^GET");
        }

        /// <summary>
        /// Procède à l'établissement de la connexion avec le client
        /// </summary>
        private void ProceedHandshake(string message, Client client, ref string response)
        {
            byte[] handshake = this.webSocket.BuildHandShake(message);
            response = Encoding.UTF8.GetString(handshake);
            client.SendMessage(handshake);
        }

        /// <summary>
        /// Déconnecte un joueur de sa partie
        /// </summary>
        private void DisconnectClient(Client client, DisconnectionException ex, ref bool endOfCommunication)
        {
            foreach (var game in Server.Games)
            {
                if (game.Value.Player1 == client)
                {
                    game.Value.Player1 = null;
                }
                else if (game.Value.Player2 == client)
                {
                    game.Value.Player2 = null;
                }
            }
            byte[] deconnectionBytes = this.webSocket.BuildDeconnection(ex.Code);
            client.SendMessage(deconnectionBytes);
            Console.WriteLine(ex.Message + "\n");
            endOfCommunication = true; // Fin de la communication
            this.started = false;
        }


        /// <summary>
        /// Traite le message reçu par le client
        /// </summary>
        private void TreatMessage(byte[] bytes, Client client, ref string message, ref string response)
        {
            byte[] decryptedMessage = this.webSocket.DecryptMessage(bytes);
            message = Encoding.UTF8.GetString(decryptedMessage);
            response = this.interpreter.Interpret(message, client); // Interprétation du message reçu

            string responseType = response.Split("_")[0]; // Récupération du type de réponse (Send ou Broadcast)
            string responseData = response.Split("_")[1]; // Récupération des données à envoyer

            int idGame = Convert.ToInt32(responseData.Split("/")[0]); // Id de la partie concernée
            byte[] responseBytes = this.webSocket.BuildMessage(responseData);
            Game game = games[idGame];
            if (responseType == "Send")
            {
                this.SendMessage(client, responseBytes);
            }
            else if (responseType == "Broadcast")
            {
                this.BroadastMessage(game, responseBytes);
            }
            response = responseData;
            if (game.IsFull && !this.started)
            {
                this.StartGame(game);
            }
        }

        private void SendMessage(Client client, byte[] bytes)
        {
            if (client != null)
            {
                client.SendMessage(bytes);
            }
        }

        private void BroadastMessage(Game game, byte[] bytes)
        {
            this.SendMessage(game.Player1, bytes);
            this.SendMessage(game.Player2, bytes);

            if (this.TestWin(game)) // Test si la partie est terminée et lance la gestion de fin de partie si c'est le cas
            {
                this.handleGameEnd(game);
            }
        }


        /// <summary>
        /// Démarre une partie
        /// </summary>
        private void StartGame(Game game)
        {
            game.Player1.User = this.gameManager.GetUserByToken(game.Player1.User.Token);
            game.Player2.User = this.gameManager.GetUserByToken(game.Player2.User.Token);
            byte[] startP1 = this.webSocket.BuildMessage($"{game.Id}/Start:{game.Player2.User.Name}"); // Envoi du nom du joueur à son adversaire
            byte[] startP2 = this.webSocket.BuildMessage($"{game.Id}/Start:{game.Player1.User.Name}"); // Envoi du nom du joueur à son adversaire
            this.started = true;
            this.SendMessage(game.Player1, startP1);
            this.SendMessage(game.Player2, startP2);
        }

        /// <summary>
        /// Gère la fin de partie en récupérant le score final des deux joueurs et en renvoyant le gagnant aux deux joueurs 
        /// </summary>
        private void handleGameEnd(Game game)
        {
            (int,int) scores = game.GetScore();
            int scorePlayer1 = scores.Item1;
            int scorePlayer2 = scores.Item2;
            
            if(scorePlayer1 >= scorePlayer2)
            {
                this.gameManager.UpdateEloWinnerLooser(game.Player1.User, game.Player2.User);
            }
            else
            {
                this.gameManager.UpdateEloWinnerLooser(game.Player2.User, game.Player1.User);
            }
        
            bool player1won = scorePlayer1 >= scorePlayer2;
            bool player2won = scorePlayer2 > scorePlayer1;

            //todo: gérer le gain et la perte d'elo en fonction du résultat (dans l'interpreter)

            byte[] endOfGameMessagePlayer1 = this.webSocket.BuildMessage($"{game.Id}/EndOfGame:{scorePlayer1}-{scorePlayer2}|{player1won}");
            byte[] endOfGameMessagePlayer2 = this.webSocket.BuildMessage($"{game.Id}/EndOfGame:{scorePlayer2}-{scorePlayer1}|{player2won}");
            this.SendMessage(game.Player1, endOfGameMessagePlayer1);
            this.SendMessage(game.Player2, endOfGameMessagePlayer2);
        }

        /// <summary>
        /// Test si un joueur a gagné
        /// </summary>
        private bool TestWin(Game game)
        {
            return game.TestWin();
        }
 
    }

}
