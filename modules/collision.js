/**
 * Checks if two circular entities are colliding.
 * @param {Object} entity1 - The first entity.
 * @param {Object} entity1.position - The position of the first entity.
 * @param {number} entity1.position.x - The x-coordinate of the first entity.
 * @param {number} entity1.position.y - The y-coordinate of the first entity.
 * @param {number} entity1.radius - The radius of the first entity.
 * @param {Object} entity2 - The second entity.
 * @param {Object} entity2.position - The position of the second entity.
 * @param {number} entity2.position.x - The x-coordinate of the second entity.
 * @param {number} entity2.position.y - The y-coordinate of the second entity.
 * @param {number} entity2.radius - The radius of the second entity.
 * @returns {boolean} True if the entities are colliding, false otherwise.
 */
function circleCollision(entity1, entity2) {
  return Math.hypot(entity1.position.x - entity2.position.x, entity1.position.y - entity2.position.y) <= entity1.radius + entity2.radius;
}

/**
 * Checks if two rectangular entities are colliding.
 * @param {Object} entity1 - The first entity.
 * @param {Object} entity1.position - The position of the first entity.
 * @param {number} entity1.position.x - The x-coordinate of the first entity.
 * @param {number} entity1.position.y - The y-coordinate of the first entity.
 * @param {number} entity1.radius - The radius of the first entity.
 * @param {Object} entity2 - The second entity.
 * @param {Object} entity2.position - The position of the second entity.
 * @param {number} entity2.position.x - The x-coordinate of the second entity.
 * @param {number} entity2.position.y - The y-coordinate of the second entity.
 * @param {number} entity2.radius - The radius of the second entity.
 * @returns {boolean} True if the entities are colliding, false otherwise.
 */
function rectangleCollision(entity1, entity2) {
  return entity1.position.x + entity1.radius >= entity2.position.x &&
         entity1.position.x - entity1.radius <= entity2.position.x + entity2.radius &&
         entity1.position.y + entity1.radius >= entity2.position.y &&
         entity1.position.y - entity1.radius <= entity2.position.y + entity2.radius;
}

/**
 * Checks if an entity is colliding with a line.
 * @param {Object} entity - The entity.
 * @param {Object} entity.position - The position of the entity.
 * @param {number} entity.position.x - The x-coordinate of the entity.
 * @param {number} entity.position.y - The y-coordinate of the entity.
 * @param {number} entity.radius - The radius of the entity.
 * @param {Array<Array<number>>} line - The line segments.
 * @param {number} lineWidth - The width of the line.
 * @returns {boolean} True if the entity is colliding with the line, false otherwise.
 */
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

/**
 * Calculates the distance from a point to a line segment.
 * @param {Object} point - The point.
 * @param {number} point.x - The x-coordinate of the point.
 * @param {number} point.y - The y-coordinate of the point.
 * @param {Object} v - The start point of the line segment.
 * @param {number} v.x - The x-coordinate of the start point.
 * @param {number} v.y - The y-coordinate of the start point.
 * @param {Object} w - The end point of the line segment.
 * @param {number} w.x - The x-coordinate of the end point.
 * @param {number} w.y - The y-coordinate of the end point.
 * @returns {number} The distance from the point to the line segment.
 */
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