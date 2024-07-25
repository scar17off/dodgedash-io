const { isWithinBorderOrStartZone } = require("../utils");
const { heroType } = require("../protocol.json");

class Player {
  constructor(socket, regionName, areaNumber) {
    this.id = server.lastId++;
    this.socket = socket;
    this.position = { x: 0, y: 0 };
    this.radius = 15;
    this.baseSpeed = 8;
    this._heroType = heroType[0].id;
    this.color = heroType[0].color;
    this.input = {
      mouse: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false },
      mouseMovement: false
    };
    this.regionName = regionName;
    this.areaNumber = areaNumber;
  }

  getRandomSpawnPosition(area) {
    const startZone = area.startZone;
    const margin = this.radius;
    
    return {
      x: startZone.position.x + margin + Math.random() * (startZone.size.width - 2 * margin),
      y: startZone.position.y + margin + Math.random() * (startZone.size.height - 2 * margin)
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

  update(area, deltaTime) {
    const { mouse, keys, mouseMovement } = this.input;
    let newPosition = { ...this.position };
    const speed = this.isInStartZone(area) ? 10 : this.baseSpeed;

    if (mouseMovement) {
      const distance = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
      if (distance > 0) {
        const moveSpeed = Math.min(distance / 10, speed);
        newPosition.x += (mouse.x / distance) * moveSpeed;
        newPosition.y += (mouse.y / distance) * moveSpeed;
      }
    } else {
      let dx = 0;
      let dy = 0;
      if (keys.w) dy -= 1;
      if (keys.s) dy += 1;
      if (keys.a) dx -= 1;
      if (keys.d) dx += 1;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      newPosition.x += dx * speed;
      newPosition.y += dy * speed;
    }

    // Adjust position if it's outside the allowed area
    this.adjustPosition(newPosition, area);
  }

  adjustPosition(newPosition, area) {
    const { border, startZone } = area;
    const [topLeft, topRight, bottomRight, bottomLeft] = border;

    // Check if the new position is within the border or start zone
    if (isWithinBorderOrStartZone(newPosition, border, startZone, this.radius)) {
      this.position = newPosition;
    } else {
      // If outside, clamp the position to the nearest valid point
      this.position.x = Math.max(topLeft.x + this.radius, Math.min(newPosition.x, topRight.x - this.radius));
      this.position.y = Math.max(topLeft.y + this.radius, Math.min(newPosition.y, bottomLeft.y - this.radius));
    }
  }

  isInStartZone(area) {
    return (
      this.position.x >= area.startZone.position.x &&
      this.position.x <= area.startZone.position.x + area.startZone.size.width &&
      this.position.y >= area.startZone.position.y &&
      this.position.y <= area.startZone.position.y + area.startZone.size.height
    );
  }

  isInFinishZone(area) {
    return (
      this.position.x >= area.finishZone.position.x &&
      this.position.x <= area.finishZone.position.x + area.finishZone.size.width &&
      this.position.y >= area.finishZone.position.y &&
      this.position.y <= area.finishZone.position.y + area.finishZone.size.height
    );
  }

  isInPreviousAreaZone(area) {
    if (!area.previousAreaZone) {
      return false;
    }
    return (
      this.position.x >= area.previousAreaZone.position.x &&
      this.position.x <= area.previousAreaZone.position.x + area.previousAreaZone.size.width &&
      this.position.y >= area.previousAreaZone.position.y &&
      this.position.y <= area.previousAreaZone.position.y + area.previousAreaZone.size.height
    );
  }
}

module.exports = Player;