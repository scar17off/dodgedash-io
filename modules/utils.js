function isWithinBorder(position, border, radius = 0) {
  const [topLeft, topRight, bottomRight, bottomLeft] = border;
  return (
    position.x >= topLeft.x + radius &&
    position.x <= topRight.x - radius &&
    position.y >= topLeft.y + radius &&
    position.y <= bottomLeft.y - radius
  );
}

function isWithinBorderOrStartZone(position, border, startZone, radius = 0) {
  return isWithinBorder(position, border, radius) || 
    (position.x >= startZone.position.x + radius &&
     position.x <= startZone.position.x + startZone.size.width - radius &&
     position.y >= startZone.position.y + radius &&
     position.y <= startZone.position.y + startZone.size.height - radius);
}

module.exports = { isWithinBorder, isWithinBorderOrStartZone };