class Renderer {
  constructor(context, camera, options = { grid: false, darkMode: false, enemyOutline: false }) {
    this.context = context;
    this.camera = camera;
    this.options = options;
  }

  renderArea(area) {
    if (!area) {
      return;
    }
    if (!area.position || !area.size) {
      console.warn('Invalid area data:', JSON.stringify(area, null, 2));
      return;
    }

    // Draw border
    this.context.strokeStyle = this.options.darkMode ? 'white' : 'black';
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

    // Draw cyan line at the right edge of start zone (only in first area)
    if (area.areaNumber === 0) {
      this.context.beginPath();
      this.context.strokeStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan color
      const lineWidth = 50;
      this.context.lineWidth = lineWidth;
      // Draw line on the right side of the start zone
      const x = area.startZone.position.x + area.startZone.size.width - (lineWidth / 2);
      this.context.moveTo(x, area.startZone.position.y);
      this.context.lineTo(x, area.startZone.position.y + area.startZone.size.height);
      this.context.stroke();
    }

    // Draw finish zone
    this.context.fillStyle = 'rgba(255, 255, 0, 0.5)';
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
    if (this.options.grid) {
      const gridStep = 50;
      this.context.strokeStyle = this.options.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
      this.context.lineWidth = 1;

      // Vertical lines
      for (let x = area.position.x; x <= area.position.x + area.size.width; x += gridStep) {
        this.context.beginPath();
        this.context.moveTo(x, area.position.y);
        this.context.lineTo(x, area.position.y + area.size.height);
        this.context.stroke();
      }

      // Horizontal lines
      for (let y = area.position.y; y <= area.position.y + area.size.height; y += gridStep) {
        this.context.beginPath();
        this.context.moveTo(area.position.x, y);
        this.context.lineTo(area.position.x + area.size.width, y);
        this.context.stroke();
      }
    }
  }

  renderPlayer(player, isLocal = false) {
    const alpha = player.deathTimer !== -1 ? 0.75 : 1.0;
    this.context.globalAlpha = alpha;

    // Render player circle
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.radius || 25, 0, 2 * Math.PI);
    this.context.fillStyle = player.color || (isLocal ? 'white' : 'red');
    this.context.fill();

    // Render nickname
    this.context.fillStyle = this.options.darkMode ? 'white' : 'black';
    this.context.font = '12px Arial';
    this.context.textAlign = 'center';
    this.context.fillText(player.name, player.position.x, player.position.y - (player.radius || 25) - 5);

    // Render death timer
    if (player.deathTimer !== -1) {
      this.context.fillStyle = 'red';
      this.context.font = '16px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(Math.floor(player.deathTimer / 1000), player.position.x, player.position.y + 5);
    }

    // Render energy bar
    const { position, radius, energy, maxEnergy } = player;
    this.renderEnergyBar({ position, radius, energy, maxEnergy });

    this.context.globalAlpha = 1.0;
  }

  renderEnergyBar({ position, radius, energy, maxEnergy }) {
    this.context.globalAlpha = 0.65;

    const barWidth = 40;
    const barHeight = 8;
    const barX = position.x - barWidth / 2;
    const barY = position.y + (radius || 25) + 5;
    const fillWidth = (energy / maxEnergy) * barWidth;

    // Draw background bar
    this.context.fillStyle = 'gray';
    this.context.fillRect(barX, barY, barWidth, barHeight);

    // Draw filled bar
    this.context.fillStyle = 'blue';
    this.context.fillRect(barX, barY, fillWidth, barHeight);

    this.context.globalAlpha = 1.0;
  }

  renderEntity(entity) {
    if (!entity.position) return;
    this.context.beginPath();
    this.context.arc(entity.position.x, entity.position.y, entity.radius, 0, 2 * Math.PI);
    this.context.fillStyle = entity.color;
    this.context.fill();

    if (this.options.enemyOutline) {
      this.context.lineWidth = 3;
      this.context.strokeStyle = this.options.darkMode ? 'white' : 'black';
      this.context.stroke();
    }

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

  renderAbilityCreations(ability) {
    if (ability.creationType == "Ice Wall") {
      this.context.fillStyle = ability.color;
      this.context.fillRect(ability.position.x, ability.position.y, ability.size.width, ability.size.height);
    } else if (ability.creationType == "Magnetic Field" && ability.isActive) {
      this.context.beginPath();
      this.context.arc(ability.position.x, ability.position.y, ability.radius, 0, 2 * Math.PI);
      this.context.fillStyle = ability.color;
      this.context.fill();
      // Add a subtle border to make the field more visible
      this.context.strokeStyle = 'rgba(255, 0, 255, 0.5)';
      this.context.lineWidth = 2;
      this.context.stroke();
    }
  }

  render(gameState) {
    const { width, height } = this.camera;
    this.context.fillStyle = this.options.darkMode ? 'black' : 'white';
    this.context.fillRect(0, 0, width, height);

    this.context.save();
    this.camera.applyTo(this.context);

    // Render area
    if (gameState && gameState.area) {
      this.renderArea(gameState.area);
    }

    // Render abilities
    if (gameState && gameState.abilityCreations && gameState.abilityCreations.length > 0) {
      for (const abilityCreation of gameState.abilityCreations) this.renderAbilityCreations(abilityCreation);
    }

    // Render local player
    if (gameState && gameState.localPlayer) {
      this.renderPlayer(gameState.localPlayer, true);
    }

    // Render other players
    if (gameState && gameState.players && gameState.players.length > 0) {
      for (const player of gameState.players) {
        if (player.id !== gameState.localPlayer?.id && player.areaNumber === gameState.localPlayer.areaNumber) {
          this.renderPlayer(player);
        }
      }
    }

    // Render entities
    if (gameState && gameState.entities && gameState.entities.length > 0) {
      for (const entity of gameState.entities) {
        this.renderEntity(entity);
      }
    }

    this.context.restore();
  }
}

export default Renderer;