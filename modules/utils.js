const chalk = require('chalk');

/**
 * Checks if a position is within the given border with an optional radius.
 * @param {Object} position - The position to check.
 * @param {number} position.x - The x-coordinate of the position.
 * @param {number} position.y - The y-coordinate of the position.
 * @param {Array<Object>} border - The border defined by four corner points.
 * @param {Object} border[].x - The x-coordinate of a border point.
 * @param {Object} border[].y - The y-coordinate of a border point.
 * @param {number} [radius=0] - The optional radius to consider.
 * @returns {boolean} - True if the position is within the border, false otherwise.
 */
function isWithinBorder(position, border, radius = 0) {
  const [topLeft, topRight, bottomRight, bottomLeft] = border;
  return (
    position.x >= topLeft.x + radius &&
    position.x <= topRight.x - radius &&
    position.y >= topLeft.y + radius &&
    position.y <= bottomLeft.y - radius
  );
}

/**
 * Checks if a position is within the given border or start zone with an optional radius.
 * @param {Object} position - The position to check.
 * @param {number} position.x - The x-coordinate of the position.
 * @param {number} position.y - The y-coordinate of the position.
 * @param {Array<Object>} border - The border defined by four corner points.
 * @param {Object} border[].x - The x-coordinate of a border point.
 * @param {Object} border[].y - The y-coordinate of a border point.
 * @param {Object} startZone - The start zone defined by position and size.
 * @param {Object} startZone.position - The position of the start zone.
 * @param {number} startZone.position.x - The x-coordinate of the start zone position.
 * @param {number} startZone.position.y - The y-coordinate of the start zone position.
 * @param {Object} startZone.size - The size of the start zone.
 * @param {number} startZone.size.width - The width of the start zone.
 * @param {number} startZone.size.height - The height of the start zone.
 * @param {number} [radius=0] - The optional radius to consider.
 * @returns {boolean} - True if the position is within the border or start zone, false otherwise.
 */
function isWithinBorderOrStartZone(position, border, startZone, radius = 0) {
  return isWithinBorder(position, border, radius) || 
    (position.x >= startZone.position.x + radius &&
     position.x <= startZone.position.x + startZone.size.width - radius &&
     position.y >= startZone.position.y + radius &&
     position.y <= startZone.position.y + startZone.size.height - radius);
}

/**
 * Logs a message with a timestamp and a prefix.
 * @param {string} prefix - The prefix for the log message.
 * @param {...*} args - The arguments to log.
 */
function log(prefix, ...args) {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB').replace(/\//g, '.');
  const time = now.toTimeString().split(' ')[0].slice(0, 5);
  console.log(chalk.blueBright(`[${date}] [${time}] [${prefix}]`), chalk.white(...args));
}

module.exports = { isWithinBorder, isWithinBorderOrStartZone, log };