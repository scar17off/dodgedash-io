const Entity = require('./Entity');
const { checkCollisions, isInPlayZone, bounceMovement } = require('./Behaviour');

module.exports = class Clinger extends Entity {
  constructor() {
    super();
    this.entityType = 'Clinger';
    this.radius = 8;
    this.speed = 3;
    this.color = "#FF6B6B";
    this.stickDuration = 180; // 3 seconds at 60 fps
    this.stickTimer = 0;
    this.targetEntity = null;
    this.stuckGroup = null;
    this.changeTargetTimer = 300; // 5 seconds at 60 fps
    this.isSearchingTarget = false;
    this.update = (area) => this.clingerMovement(area);
  }

  clingerMovement(area) {
    this.changeTargetTimer--;

    if (this.changeTargetTimer <= 0 || !this.targetEntity) {
      this.isSearchingTarget = true;
      this.findNewTarget(area);
      this.changeTargetTimer = 300; // Reset the timer
      this.leaveStuckGroup();
      this.isSearchingTarget = false;
    }

    if (this.targetEntity) {
      if (this.stickTimer > 0) {
        this.stickTimer--;
        if (!this.stuckGroup) {
          this.createOrJoinStuckGroup(area);
        }
        this.stickToTarget();
      } else {
        this.moveTowardsTarget();
      }
    }

    bounceMovement(this, area);
  }

  findNewTarget(area) {
    const enemies = area.entities.filter(entity => 
      entity !== this && 
      entity !== this.targetEntity && 
      isInPlayZone(entity.position, area) &&
      !(entity.entityType === 'Clinger' && entity.isSearchingTarget)
    );

    if (enemies.length > 0) {
      const closestEnemy = enemies.reduce((closest, current) => {
        const distanceToCurrent = Math.hypot(this.position.x - current.position.x, this.position.y - current.position.y);
        const distanceToClosest = Math.hypot(this.position.x - closest.position.x, this.position.y - closest.position.y);
        return distanceToCurrent < distanceToClosest ? current : closest;
      });

      this.targetEntity = closestEnemy;
      this.stickTimer = 0; // Start moving towards the target instead of sticking immediately
    } else {
      this.targetEntity = null;
    }
  }

  moveTowardsTarget() {
    if (!this.targetEntity) return;

    const dx = this.targetEntity.position.x - this.position.x;
    const dy = this.targetEntity.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.radius + this.targetEntity.radius) {
      this.stickTimer = this.stickDuration;
    } else {
      this.velocity.x = (dx / distance) * this.speed;
      this.velocity.y = (dy / distance) * this.speed;
    }
  }

  createOrJoinStuckGroup(area) {
    const existingGroup = area.entities.find(entity => 
      entity.entityType === 'Clinger' && 
      entity.stuckGroup && 
      entity.stuckGroup.entities.includes(this.targetEntity)
    );

    if (existingGroup) {
      this.stuckGroup = existingGroup.stuckGroup;
      this.stuckGroup.entities.push(this);
    } else {
      this.stuckGroup = {
        entities: [this, this.targetEntity]
      };
    }
  }

  leaveStuckGroup() {
    if (this.stuckGroup) {
      this.stuckGroup.entities = this.stuckGroup.entities.filter(entity => entity !== this);
      if (this.stuckGroup.entities.length === 1) {
        this.stuckGroup.entities[0].stuckGroup = null;
      }
    }
    this.stuckGroup = null;
  }

  stickToTarget() {
    if (!this.targetEntity) return;

    const angle = Math.atan2(this.position.y - this.targetEntity.position.y, this.position.x - this.targetEntity.position.x);
    this.position.x = this.targetEntity.position.x + Math.cos(angle) * (this.targetEntity.radius + this.radius);
    this.position.y = this.targetEntity.position.y + Math.sin(angle) * (this.targetEntity.radius + this.radius);
    
    this.velocity.x = this.targetEntity.velocity.x;
    this.velocity.y = this.targetEntity.velocity.y;
  }
}