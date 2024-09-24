function circleCollision(entity1, entity2) {
  return Math.hypot(entity1.position.x - entity2.position.x, entity1.position.y - entity2.position.y) <= entity1.radius + entity2.radius;
}

function rectangleCollision(entity1, entity2) {
  return entity1.position.x + entity1.radius >= entity2.position.x &&
         entity1.position.x - entity1.radius <= entity2.position.x + entity2.radius &&
         entity1.position.y + entity1.radius >= entity2.position.y &&
         entity1.position.y - entity1.radius <= entity2.position.y + entity2.radius;
}

function lineCollision(entity, line, lineWidth) {
  for (const segment of line) {
    const [x1, y1, x2, y2] = segment;
    const dist = pointToSegmentDistance(entity.position, { x: x1, y: y1 }, { x: x2, y: y2 });
    if (dist <= entity.radius + lineWidth / 2) {
      return true;
    }
  }
  return false;
}

function pointToSegmentDistance(point, v, w) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(point.x - v.x, point.y - v.y);
  let t = ((point.x - v.x) * (w.x - v.x) + (point.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(point.x - (v.x + t * (w.x - v.x)), point.y - (v.y + t * (w.y - v.y)));
}

module.exports = {
  circleCollision,
  rectangleCollision,
  lineCollision
};