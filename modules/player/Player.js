const { heroType } = require("../protocol.json");

class Player {
  constructor(socket, area) {
    this.id = server.lastId++;
    this.socket = socket;
    this.position = this.getRandomSpawnPosition(area);
    this.radius = 15;
    this.speed = 5 / 5;
    this._heroType = heroType[0].id;
    this.color = heroType[0].color;
    this.input = {
      mouse: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false },
      mouseMovement: false
    };
    this.area = area;
  }

  getRandomSpawnPosition(area) {
    return {
      x: area.position.x + Math.random() * area.size.width,
      y: area.position.y + Math.random() * area.size.height
    };
  }

  get heroType() {
    return this._heroType;
  }

  set heroType(newHeroTypeId) {
    const hero = heroType.find(h => h.id === newHeroTypeId);
    if (hero) {
      this._heroType = newHeroTypeId;
      this.color = hero.color;
    } else {
      console.error(`Hero type with id ${newHeroTypeId} not found`);
    }
  }

  handleInput(input) {
    this.input = input;
  }

  update() {
    const { mouse, keys, mouseMovement } = this.input;
    if (mouseMovement) {
      const distance = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
      if (distance > 0) {
        const speed = Math.min(distance / 10, this.speed);
        this.position.x += (mouse.x / distance) * speed;
        this.position.y += (mouse.y / distance) * speed;
      }
    } else {
      if (keys.w) this.position.y -= this.speed;
      if (keys.s) this.position.y += this.speed;
      if (keys.a) this.position.x -= this.speed;
      if (keys.d) this.position.x += this.speed;
    }
  }
}

module.exports = Player;