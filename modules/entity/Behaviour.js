const checkCollisions = (entity, area, newX, newY) => {
  const { startZone, finishZone } = area;

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
  if (newX - entity.radius < finishZone.position.x && newX + entity.radius > finishZone.position.x) {
    entity.velocity.x *= -1;
    newX = finishZone.position.x - entity.radius;
  } else if (newX - entity.radius < finishZone.position.x + finishZone.size.width && newX + entity.radius > finishZone.position.x + finishZone.size.width) {
    entity.velocity.x *= -1;
    newX = finishZone.position.x + finishZone.size.width + entity.radius;
  }
  if (newY - entity.radius < finishZone.position.y && newY + entity.radius > finishZone.position.y) {
    entity.velocity.y *= -1;
    newY = finishZone.position.y - entity.radius;
  } else if (newY - entity.radius < finishZone.position.y + finishZone.size.height && newY + entity.radius > finishZone.position.y + finishZone.size.height) {
    entity.velocity.y *= -1;
    newY = finishZone.position.y + finishZone.size.height + entity.radius;
  }

  return { newX, newY };
};

const bounceMovement = (entity, area) => {
  if (entity.velocity.x === 0 && entity.velocity.y === 0) {
    const angle = Math.random() * 2 * Math.PI;
    entity.velocity = {
      x: Math.cos(angle) * entity.speed,
      y: Math.sin(angle) * entity.speed
    };
  }
  let newX = entity.position.x + entity.velocity.x;
  let newY = entity.position.y + entity.velocity.y;

  ({ newX, newY } = checkCollisions(entity, area, newX, newY));

  entity.position.x = newX;
  entity.position.y = newY;
};

const zigzagMovement = (entity, area) => {
  if (!entity.zigzagTimer) {
    entity.zigzagTimer = 0;
    entity.zigzagDirection = 1;
  }
  entity.zigzagTimer += 1;
  if (entity.zigzagTimer > 60) {
    entity.zigzagTimer = 0;
    entity.zigzagDirection *= -1;
  }
  entity.velocity.x = entity.speed * Math.cos(entity.zigzagTimer * 0.1) * entity.zigzagDirection;
  entity.velocity.y = entity.speed * Math.sin(entity.zigzagTimer * 0.1);
  
  let newX = entity.position.x + entity.velocity.x;
  let newY = entity.position.y + entity.velocity.y;

  ({ newX, newY } = checkCollisions(entity, area, newX, newY));

  entity.position.x = newX;
  entity.position.y = newY;
};

const chaserMovement = (entity, area) => {
  const playerInPlayZone = area.players.find(player => isInPlayZone(player.position, area));
  if (playerInPlayZone && isInPlayZone(entity.position, area)) {
    const dx = playerInPlayZone.position.x - entity.position.x;
    const dy = playerInPlayZone.position.y - entity.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    entity.velocity.x = (dx / distance) * entity.speed;
    entity.velocity.y = (dy / distance) * entity.speed;
  } else if (entity.velocity.x === 0 && entity.velocity.y === 0) {
    entity.velocity = {
      x: (Math.random() - 0.5) * entity.speed,
      y: (Math.random() - 0.5) * entity.speed
    };
  }

  let newX = entity.position.x + entity.velocity.x;
  let newY = entity.position.y + entity.velocity.y;

  ({ newX, newY } = checkCollisions(entity, area, newX, newY));

  entity.position.x = newX;
  entity.position.y = newY;
};

const teleporterMovement = (entity, area) => {
  if (!entity.teleportTimer) {
    entity.teleportTimer = 0;
  }
  entity.teleportTimer += 1;
  if (entity.teleportTimer > 180) {
    entity.teleportTimer = 0;
    const teleportRadius = 50;
    const angle = Math.random() * 2 * Math.PI;
    let newX = entity.position.x + Math.cos(angle) * teleportRadius;
    let newY = entity.position.y + Math.sin(angle) * teleportRadius;
    ({ newX, newY } = checkCollisions(entity, area, newX, newY));
    entity.position.x = newX;
    entity.position.y = newY;
  } else {
    let newX = entity.position.x + entity.velocity.x;
    let newY = entity.position.y + entity.velocity.y;
    ({ newX, newY } = checkCollisions(entity, area, newX, newY));
    entity.position.x = newX;
    entity.position.y = newY;
  }
};

const isInPlayZone = (position, area) => {
  const { startZone, finishZone } = area;
  return (
    position.x > startZone.position.x + startZone.size.width &&
    position.x < finishZone.position.x &&
    position.y > area.position.y &&
    position.y < area.position.y + area.size.height
  );
};

const ensureWithinBounds = (position, radius, area) => {
  return {
    x: Math.max(area.position.x + radius, Math.min(position.x, area.position.x + area.size.width - radius)),
    y: Math.max(area.position.y + radius, Math.min(position.y, area.position.y + area.size.height - radius))
  };
};

module.exports = {
  bounceMovement,
  zigzagMovement,
  chaserMovement,
  teleporterMovement,
  ensureWithinBounds,
  isInPlayZone,
  checkCollisions
};