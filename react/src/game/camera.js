class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.zoom = 1;
    this.zoomLock = false;
    this.minZoom = 0.5;
    this.maxZoom = 2;
    this.zoomStep = 0.1;
  }

  update(playerX, playerY) {
    this.x = playerX - this.centerX / this.zoom;
    this.y = playerY - this.centerY / this.zoom;
  }

  applyTo(context) {
    context.save();
    context.translate(this.centerX, this.centerY);
    context.scale(this.zoom, this.zoom);
    context.translate(-this.centerX, -this.centerY);
    context.translate(-this.x, -this.y);
  }

  restore(context) {
    context.restore();
  }

  zoomIn() {
    if (!this.zoomLock && this.zoom < this.maxZoom) {
      this.zoom = Math.min(this.zoom + this.zoomStep, this.maxZoom);
    }
  }

  zoomOut() {
    if (!this.zoomLock && this.zoom > this.minZoom) {
      this.zoom = Math.max(this.zoom - this.zoomStep, this.minZoom);
    }
  }

  setZoom(value) {
    if (!this.zoomLock) {
      this.zoom = Math.max(this.minZoom, Math.min(value, this.maxZoom));
    }
  }

  toggleZoomLock() {
    this.zoomLock = !this.zoomLock;
  }
}

export default Camera;