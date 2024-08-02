class AbilityCreation {
  constructor() {
    this.id == server.lastId++;
    this.creationType = null;
    this.position = { x: 0, y: 0 };
    this.color = "#ffffff";
    this.destroyCooldown = -1;
  }

  update(area) {
    if (Date.now() - this.creationTIme >= this.destroyCooldown * 1000 && this.destroyCooldown !== -1) {
      const index = area.abilityCreations.indexOf(this);
      if (index !== -1) {
        area.abilityCreations.splice(index, 1);
      }
    }
  }

  getCreationData() {
    return {
      creationType: this.creationType,
      position: this.position,
      color: this.color
    }
  }
}

module.exports = AbilityCreation;