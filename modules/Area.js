class Area {
  constructor(data = { position: { x: 0, y: 0 }, size: { width: 1000, height: 480 }, background: 'black' }) {
    this.position = data.position;
    this.size = data.size;
    this.background = data.background;
    this.players = [];
    this.entities = [];
    this.border = [this.position, { x: this.position.x + this.size.width, y: this.position.y }, { x: this.position.x + this.size.width, y: this.position.y + this.size.height }, { x: this.position.x, y: this.position.y + this.size.height }];
  }

  getAreaData() {
    return {
      position: this.position,
      size: this.size,
      background: this.background,
      border: this.border
    };
  }
}

module.exports = Area;