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
      socket.emit('test', 'This part of the string is comming from server!');

      const newPlayer = gameController.newPlayer();
      const allPlayers = gameController.getPlayers();

      socket.emit('getPlayers', { me: newPlayer, allPlayers });
    });
  }
}

export default SocketController;
