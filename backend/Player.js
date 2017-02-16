/* eslint no-console: 0 */

class Player {
  constructor(id) {
    this.id = id;
    this.x = 2;
    this.y = 2;
    console.log(`[Player] Created new player with id: ${id}`);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getPosition() {
    const { x, y } = this;
    return { x, y };
  }
}

export default Player;
