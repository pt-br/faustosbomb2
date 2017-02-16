import SocketIo from 'socket.io';

class SocketController {
  constructor(port) {
    this.io = new SocketIo(port);
  }

  socketListener() {
    const { io } = this;
    io.on('connection', (socket) => {
      console.log('[Socket.io - Server] User connected');
      socket.emit('test', 'This part of the string is comming from server!');
    });
  }
}

export default SocketController;
