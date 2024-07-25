class Area {
  constructor(data = { position: { x: 0, y: 0 }, size: { width: 1000, height: 480 }, background: 'black' }) {
    this.position = data.position;
    this.size = data.size;
    this.background = data.background;
    this.players = [];
    this.entities = [];
    this.border = [
      { x: this.position.x, y: this.position.y },
      { x: this.position.x + this.size.width, y: this.position.y },
      { x: this.position.x + this.size.width, y: this.position.y + this.size.height },
      { x: this.position.x, y: this.position.y + this.size.height }
    ];
    this.startZone = {
      position: { x: this.position.x, y: this.position.y },
      size: { width: this.size.width / 5, height: this.size.height }
    };
  }

  getAreaData() {
    return {
      position: this.position,
      size: this.size,
      background: this.background,
      border: this.border,
      startZone: this.startZone
    };
  }
}

module.exports = Area;