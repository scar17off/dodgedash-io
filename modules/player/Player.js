const { isWithinBorderOrStartZone, log } = require("../utils");
const { heroType } = require("../protocol.json");

const abilityTypes = require("../ability/Abilities");
const Ability = require("../ability/Ability");
const { circleCollision } = require('../collision');
const defaultHero = heroType[0];

/**
 * Represents a player in the game.
 */
class Player {
  /**
   * Creates a new player instance.
   * @param {Object} socket - The socket associated with the player.
   */
  constructor(socket) {
    /**
     * The unique ID of the player.
     * @type {number}
     */
    this.id = server.lastId++;

    /**
     * The socket associated with the player.
     * @type {Object}
     */
    this.socket = socket;

    /**
     * The position of the player.
     * @type {Object}
     * @property {number} x - The x-coordinate of the player.
     * @property {number} y - The y-coordinate of the player.
     */
    this.position = { x: 0, y: 0 };

    /**
     * The radius of the player.
     * @type {number}
     */
    this.radius = 15;

    /**
     * The base speed of the player.
     * @type {number}
     */
    this.baseSpeed = 5;

    /**
     * The hero type ID of the player.
     * @type {number}
     * @private
     */
    this._heroType = defaultHero.id;

    /**
     * The color of the player.
     * @type {string}
     */
    this.color = defaultHero.color;

    /**
     * The input state of the player.
     * @type {Object}
     * @property {Object} mouse - The mouse position.
     * @property {number} mouse.x - The x-coordinate of the mouse.
     * @property {number} mouse.y - The y-coordinate of the mouse.
     * @property {Object} keys - The state of the movement keys.
     * @property {boolean} keys.w - The state of the 'w' key.
     * @property {boolean} keys.a - The state of the 'a' key.
     * @property {boolean} keys.s - The state of the 's' key.
     * @property {boolean} keys.d - The state of the 'd' key.
     * @property {boolean} mouseMovement - Whether the mouse is being moved.
     */
    this.input = {
      mouse: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false },
      mouseMovement: false
    };

    /**
     * The name of the region the player is in.
     * @type {string}
     */
    this.regionName = "Alpha";

    /**
     * The area number the player is in.
     * @type {number}
     */
    this.areaNumber = 0;

    /**
     * The death timer of the player.
     * @type {number}
     */
    this.deathTimer = -1;

    /**
     * The maximum energy of the player.
     * @type {number}
     */
    this.maxEnergy = 30;

    /**
     * The current energy of the player.
     * @type {number}
     */
    this.energy = 30;

    /**
     * The energy regeneration rate of the player.
     * @type {number}
     */
    this.energyRegen = 1;

    /**
     * The level of the player.
     * @type {number}
     */
    this.level = 1;

    /**
     * The upgrade points of the player.
     * @type {number}
     */
    this.upgradePoints = 0;

    /**
     * The experience of the player.
     * @type {number}
     */
    this.xp = 0;

    /**
     * The abilities of the player.
     * @type {Array<Ability>}
     */
    this.abilities = [
      new abilityTypes.IceWall(),
      new abilityTypes.ColdImmunity()
    ];

    this.completedAreas = new Set(); // Track completed areas as "regionName-areaNumber"
  }

  resetInputState() {
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.velocity = { x: 0, y: 0 };
  }

  respawn() {
    this.deathTimer = -1;
    const area = server.getArea(server.regions[this.regionName], this.areaNumber);
    this.position = this.getRandomSpawnPosition(area);
  }

  collideCheck(player) {
    return circleCollision(this, player);
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
      // Setting the abilities to the new hero's abilities
      this.abilities = hero.abilities.map(ability => {
        const abilityClass = abilityTypes[ability.name.replace(/\s+/g, '')];
        if (abilityClass) {
          return new abilityClass();
        } else {
          log("WARN", `Ability ${ability.name} not found in abilityTypes. Skipping.`);
          return null;
        }
      }).filter(ability => ability !== null);
    } else {
      console.error(`Hero type with id ${newHeroTypeId} not found`);
    }
  }

  handleInput(input) {
    this.input = input;
  }

  update(area) {
    if (this.deathTimer > 0) {
      return;
    }

    const { mouse, keys, mouseMovement } = this.input;
    let newPosition = { ...this.position };
    const speed = this.isInStartZone(area) || this.isInFinishZone(area) ? 10 : this.baseSpeed;

    if (mouseMovement) {
      const distance = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
      if (distance > 0) {
        const moveSpeed = Math.min(distance, speed);
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

  adjustPosition(newPosition, region) {
    const { border, startZone } = region;
    const [topLeft, topRight, bottomRight, bottomLeft] = border;

    this.position = newPosition;

    if (!isWithinBorderOrStartZone(newPosition, border, startZone, this.radius)) {
      // If outside, clamp the position to the nearest valid point
      this.position.x = Math.max(topLeft.x + this.radius, Math.min(newPosition.x, topRight.x - this.radius));
      this.position.y = Math.max(topLeft.y + this.radius, Math.min(newPosition.y, bottomLeft.y - this.radius));
    }
  }

  isInStartZone(region) {
    return (
      this.position.x >= region.startZone.position.x &&
      this.position.x <= region.startZone.position.x + region.startZone.size.width &&
      this.position.y >= region.startZone.position.y &&
      this.position.y <= region.startZone.position.y + region.startZone.size.height
    );
  }

  isInFinishZone(region) {
    return (
      this.position.x >= region.finishZone.position.x &&
      this.position.x <= region.finishZone.position.x + region.finishZone.size.width &&
      this.position.y >= region.finishZone.position.y &&
      this.position.y <= region.finishZone.position.y + region.finishZone.size.height
    );
  }

  isInNextAreaZone(area) {
    return (
      this.position.x + this.radius >= area.nextAreaZone.position.x &&
      this.position.x - this.radius <= area.nextAreaZone.position.x + area.nextAreaZone.size.width &&
      this.position.y + this.radius >= area.nextAreaZone.position.y &&
      this.position.y - this.radius <= area.nextAreaZone.position.y + area.nextAreaZone.size.height
    );
  }

  isInPreviousAreaZone(area) {
    if (!area.previousAreaZone) {
      return false;
    }
    return (
      this.position.x + this.radius >= area.previousAreaZone.position.x &&
      this.position.x - this.radius <= area.previousAreaZone.position.x + area.previousAreaZone.size.width &&
      this.position.y + this.radius >= area.previousAreaZone.position.y &&
      this.position.y - this.radius <= area.previousAreaZone.position.y + area.previousAreaZone.size.height
    );
  }

  /**
   * Retrieves the hero's experience amount to next level.
   * @returns {number} The experience amount to next level.
   */
  getXpToNextLevel() {
    return 5 * this.level;
  }

  /**
   * Adds experience to the player.
   * @param {number} xp - The amount of experience to add.
   */
  addXp(xp) {
    this.xp += xp;
    while (this.xp >= this.getXpToNextLevel()) {
      const xpToNextLevel = this.getXpToNextLevel();
      this.xp -= xpToNextLevel;
      this.level++;
      this.upgradePoints++;
    }
  }

  /**
   * Retrieves the hero's data.
   * @returns {Object} An object containing the hero's data.
   * @property {string} name - The hero's name.
   * @property {number} level - The hero's level.
   * @property {number} xp - The hero's experience.
   * @property {number} xpToNextLevel - The hero's experience to next level.
   * @property {number} upgradePoints - The hero's upgrade points.
   * @property {string} nickname - The hero's nickname.
   * @property {number} speed - The hero's speed.
   * @property {number} energy - The hero's current energy.
   * @property {number} maxEnergy - The hero's maximum energy.
   * @property {number} regen - The hero's regeneration rate.
   * @property {Array} abilities - The hero's abilities.
   */
  getHeroData() {
    return {
      name: this.name,
      level: this.level,
      xp: this.xp,
      xpToNextLevel: this.getXpToNextLevel(),
      upgradePoints: this.upgradePoints,
      nickname: this.nickname,
      speed: this.baseSpeed,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      regen: this.regen,
      abilities: this.abilities
    };
  }

  /**
   * Retrieves the player's data.
   * @returns {Object} An object containing the player's data.
   * @property {string} id - The player's ID.
   * @property {Object} position - The player's position.
   * @property {number} radius - The player's radius.
   * @property {number} speed - The player's base speed.
   * @property {string} color - The player's color.
   * @property {string} name - The player's name.
   * @property {number} areaNumber - The player's current area number.
   * @property {number} deathTimer - The player's death timer.
   */
  getPlayerData() {
    return {
      id: this.id,
      position: this.position,
      radius: this.radius,
      speed: this.baseSpeed,
      color: this.color,
      name: this.name,
      areaNumber: this.areaNumber,
      regionName: this.regionName,
      deathTimer: this.deathTimer,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      energyRegen: this.energyRegen,
      xp: this.xp,
      completedAreas: Array.from(this.completedAreas)
    }
  }

  getAreaKey() {
    return `${this.regionName}-${this.areaNumber}`;
  }

  completeArea() {
    const areaKey = this.getAreaKey();
    if (!this.completedAreas.has(areaKey)) {
      const xpReward = this.calculateAreaXP();
      this.addXp(xpReward);
      this.completedAreas.add(areaKey);
      
      this.socket.emit('heroUpdate', {
        xp: this.xp,
        level: this.level,
        xpToNextLevel: this.getXpToNextLevel(),
        upgradePoints: this.upgradePoints
      });
      
      return true;
    }
    return false;
  }

  calculateAreaXP() {
    const baseXP = 10;
    return baseXP + (this.areaNumber * 50);
  }
}

module.exports = Player;