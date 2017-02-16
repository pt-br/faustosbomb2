/* eslint no-console: 0 */

import SocketIo from 'socket.io';
import GameController from './GameController';

class SocketController {
  constructor(port) {
    this.io = new SocketIo(port);
    this.gameController = new GameController();
  }

  socketListener() {
    const { io, gameController } = this;

    io.on('connection', (socket) => {
      console.log('[Socket.io - Server] User connected');

      const player = gameController.newPlayer();
      const allPlayers = gameController.getPlayers();

      /**
       * Send players to player that is connecting the server
       */
      socket.emit('getPlayers', { me: player, allPlayers });

      /**
       * Update players that are already connected
       */
      this.updatePlayers();

      socket.on('disconnect', () => {
        gameController.disconnectPlayer(player.id);
        this.updatePlayers();
        console.log(`Player ${player.id} disconnected.`);
      });
    });
  }

  updatePlayers() {
    const { io, gameController } = this;
    const players = gameController.getPlayers();

    io.emit('updatePlayers', { players });
  }
}

export default SocketController;
