class Renderer {
  constructor(context, camera) {
    this.context = context;
    this.camera = camera;
  }

  renderArea(area, options = { grid: false }) {
    if (!area || !area.position || !area.size) {
      return;
    }

    // Draw border
    this.context.strokeStyle = 'white';
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.rect(area.position.x, area.position.y, area.size.width, area.size.height);
    this.context.stroke();

    // Draw start zone
    this.context.fillStyle = 'rgba(255, 255, 0, 0.5)';
    this.context.fillRect(
      area.startZone.position.x,
      area.startZone.position.y,
      area.startZone.size.width,
      area.startZone.size.height
    );

    // Draw grid if option is enabled
    if (options.grid) {
      this.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.context.lineWidth = 1;

      // Vertical lines
      for (let x = area.position.x; x <= area.position.x + area.size.width; x += 50) {
        this.context.beginPath();
        this.context.moveTo(x, area.position.y);
        this.context.lineTo(x, area.position.y + area.size.height);
        this.context.stroke();
      }

      // Horizontal lines
      for (let y = area.position.y; y <= area.position.y + area.size.height; y += 50) {
        this.context.beginPath();
        this.context.moveTo(area.position.x, y);
        this.context.lineTo(area.position.x + area.size.width, y);
        this.context.stroke();
      }
    }
  }

  renderPlayer(player, isLocal = false) {
    this.context.beginPath();
    this.context.arc(player.x, player.y, player.radius || 25, 0, 2 * Math.PI);
    this.context.fillStyle = player.color || (isLocal ? 'white' : 'red');
    this.context.fill();
  }

  render(gameState, options = { grid: false }) {
    const { width, height } = this.camera;
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, width, height);
    
    this.context.save();
    this.camera.applyTo(this.context);
    
    if (gameState.area) {
      this.renderArea(gameState.area, options);
    }
    if (gameState.localPlayer) {
      this.renderPlayer(gameState.localPlayer, true);
    }
    if (gameState.players) {
      for (const player of gameState.players) {
        if (player.id !== gameState.localPlayer?.id) {
          this.renderPlayer(player);
        }
      }
    }
    
    this.context.restore();
  }
}

export default Renderer;