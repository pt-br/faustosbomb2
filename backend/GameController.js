/* eslint no-console: 0 */

import ShortId from 'shortid';
import Player from './Player';

class GameController {
  constructor() {
    console.log('[GameController] New game initialized');
    this.players = [];
  }

  checkUniqueId(newId, players) {
    let isUnique = true;

    if (players.length > 0) {
      players.map(({ id }) => {
        if (id === newId) {
          isUnique = false;
        }
      }, newId);
    }
    return isUnique;
  }

  newPlayer() {
    const { players } = this;
    const id = ShortId.generate();
    const idIsUnique = this.checkUniqueId(id, players);

    if (!idIsUnique) {
      this.newPlayer();
      return false;
    }

    const player = new Player(id);

    this.players.push(player);

    return player;
  }

  getPlayers() {
    return this.players;
  }
}

export default GameController;
