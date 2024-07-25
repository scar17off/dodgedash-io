function isWithinBorder(position, border, radius = 0) {
  const [topLeft, , bottomRight] = border;
  return (
    position.x >= topLeft.x + radius &&
    position.x <= bottomRight.x - radius &&
    position.y >= topLeft.y + radius &&
    position.y <= bottomRight.y - radius
  );
}

module.exports = isWithinBorder;