const bounceMovement = (entity, area) => {
  if (entity.velocity.x === 0 && entity.velocity.y === 0) {
    entity.velocity = {
      x: (Math.random() - 0.5) * entity.speed,
      y: (Math.random() - 0.5) * entity.speed
    };
  }
  let newX = entity.position.x + entity.velocity.x;
  let newY = entity.position.y + entity.velocity.y;

  // Check for collisions with area boundaries
  if (newX - entity.radius < area.position.x || newX + entity.radius > area.position.x + area.size.width) {
    entity.velocity.x *= -1;
    newX = entity.position.x;
  }
  if (newY - entity.radius < area.position.y || newY + entity.radius > area.position.y + area.size.height) {
    entity.velocity.y *= -1;
    newY = entity.position.y;
  }

  // Check for collisions with start zone boundaries
  const startZone = area.startZone;
  if (newX - entity.radius < startZone.position.x + startZone.size.width && 
      newX + entity.radius > startZone.position.x &&
      newY - entity.radius < startZone.position.y + startZone.size.height &&
      newY + entity.radius > startZone.position.y) {
    if (entity.position.x >= startZone.position.x + startZone.size.width) {
      entity.velocity.x = Math.abs(entity.velocity.x);
      newX = startZone.position.x + startZone.size.width + entity.radius;
    } else if (entity.position.x <= startZone.position.x) {
      entity.velocity.x = -Math.abs(entity.velocity.x);
      newX = startZone.position.x - entity.radius;
    }
    if (entity.position.y >= startZone.position.y + startZone.size.height) {
      entity.velocity.y = Math.abs(entity.velocity.y);
      newY = startZone.position.y + startZone.size.height + entity.radius;
    } else if (entity.position.y <= startZone.position.y) {
      entity.velocity.y = -Math.abs(entity.velocity.y);
      newY = startZone.position.y - entity.radius;
    }
  }

  // Check for collisions with safe zone boundaries
  const safeZone = area.safeZone;
  if (newX - entity.radius < safeZone.position.x && newX + entity.radius > safeZone.position.x) {
    entity.velocity.x *= -1;
    newX = safeZone.position.x - entity.radius;
  } else if (newX - entity.radius < safeZone.position.x + safeZone.size.width && newX + entity.radius > safeZone.position.x + safeZone.size.width) {
    entity.velocity.x *= -1;
    newX = safeZone.position.x + safeZone.size.width + entity.radius;
  }
  if (newY - entity.radius < safeZone.position.y && newY + entity.radius > safeZone.position.y) {
    entity.velocity.y *= -1;
    newY = safeZone.position.y - entity.radius;
  } else if (newY - entity.radius < safeZone.position.y + safeZone.size.height && newY + entity.radius > safeZone.position.y + safeZone.size.height) {
    entity.velocity.y *= -1;
    newY = safeZone.position.y + safeZone.size.height + entity.radius;
  }

  entity.position.x = newX;
  entity.position.y = newY;
};

module.exports = {
  bounceMovement
};