class Renderer {
  constructor(context, camera) {
    this.context = context;
    this.camera = camera;
  }

  renderArea(area, options = { grid: false }) {
    if (!area) {
      console.warn('Area data is null or undefined');
      return;
    }
    if (!area.position || !area.size) {
      console.warn('Invalid area data:', JSON.stringify(area, null, 2));
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

    // Draw finish zone
    this.context.fillStyle = 'rgba(0, 255, 0, 0.5)';
    this.context.fillRect(
      area.finishZone.position.x,
      area.finishZone.position.y,
      area.finishZone.size.width,
      area.finishZone.size.height
    );

    // Draw next area zone
    this.context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    this.context.fillRect(
      area.nextAreaZone.position.x,
      area.nextAreaZone.position.y,
      area.nextAreaZone.size.width,
      area.nextAreaZone.size.height
    );

    // Draw previous area zone if it exists
    if (area.previousAreaZone) {
      this.context.fillStyle = 'rgba(0, 0, 255, 0.5)';
      this.context.fillRect(
        area.previousAreaZone.position.x,
        area.previousAreaZone.position.y,
        area.previousAreaZone.size.width,
        area.previousAreaZone.size.height
      );
    }

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
    this.context.arc(player.position.x, player.position.y, player.radius || 25, 0, 2 * Math.PI);
    this.context.fillStyle = player.color || (isLocal ? 'white' : 'red');
    this.context.fill();
    
    // Render nickname
    this.context.fillStyle = 'white';
    this.context.font = '12px Arial';
    this.context.textAlign = 'center';
    this.context.fillText(player.name, player.position.x, player.position.y - (player.radius || 25) -5);
  }

  renderEntity(entity) {
    this.context.beginPath();
    this.context.arc(entity.position.x, entity.position.y, entity.radius, 0, 2 * Math.PI);
    this.context.fillStyle = entity.color;
    this.context.fill();

    if (entity.entityType == 'Connectus' && entity.line) {
      this.context.beginPath();
      for (const segment of entity.line) {
        this.context.moveTo(segment[0], segment[1]);
        this.context.lineTo(segment[2], segment[3]);
      }
      this.context.strokeStyle = entity.color;
      this.context.lineWidth = entity.lineWidth;
      this.context.stroke();
    }
  }

  render(gameState, options = { grid: false }) {
    const { width, height } = this.camera;
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, width, height);
    
    this.context.save();
    this.camera.applyTo(this.context);
    
    if (gameState && gameState.area) {
      this.renderArea(gameState.area, options);
    } else {
      console.warn('No area data in game state:', JSON.stringify(gameState, null, 2));
    }
    
    if (gameState && gameState.entities && gameState.entities.length > 0) {
      for (const entity of gameState.entities) {
        this.renderEntity(entity);
      }
    }
    if (gameState && gameState.localPlayer) {
      this.renderPlayer(gameState.localPlayer, true);
    }
    if (gameState && gameState.players && gameState.players.length > 0) {
      for (const player of gameState.players) {
        if (player.id !== gameState.localPlayer?.id && player.areaNumber === gameState.localPlayer.areaNumber) {
          this.renderPlayer(player);
        }
      }
    }
    
    this.context.restore();
  }
}

export default Renderer;