class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.zoom = 1;
    this.zoomLock = true;
    this.minZoom = 0.5;
    this.maxZoom = 2;
    this.zoomStep = 0.1;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  update(playerX, playerY) {
    this.targetX = playerX;
    this.targetY = playerY;
    this.x = this.targetX - this.width / (2 * this.zoom);
    this.y = this.targetY - this.height / (2 * this.zoom);
  }

  applyTo(context) {
    context.save();
    context.scale(this.zoom, this.zoom);
    context.translate(-this.x, -this.y);
  }

  zoomIn() {
    if (!this.zoomLock && this.zoom < this.maxZoom) {
      const oldZoom = this.zoom;
      this.zoom = Math.min(this.zoom + this.zoomStep, this.maxZoom);
      this.adjustPositionAfterZoom(oldZoom);
    }
  }

  zoomOut() {
    if (!this.zoomLock && this.zoom > this.minZoom) {
      const oldZoom = this.zoom;
      this.zoom = Math.max(this.zoom - this.zoomStep, this.minZoom);
      this.adjustPositionAfterZoom(oldZoom);
    }
  }

  adjustPositionAfterZoom(oldZoom) {
    const zoomRatio = this.zoom / oldZoom;
    this.x = this.targetX - (this.targetX - this.x) * zoomRatio;
    this.y = this.targetY - (this.targetY - this.y) * zoomRatio;
  }

  setZoom(value) {
    if (!this.zoomLock) {
      this.zoom = Math.max(this.minZoom, Math.min(value, this.maxZoom));
    }
  }

  toggleZoomLock() {
    this.zoomLock = !this.zoomLock;
  }

  restore(context) {
    context.restore();
  }
}

export default Camera;