const Client = require("./player/Client");
const { log } = require("./utils");
const { heroType } = require("./protocol.json");

function sendPlayerUpdates(io) {
  for (const region of Object.values(server.regions)) {
    for (const area of region.getLoadedAreas()) {
      const playerUpdates = area.players.filter(player => player.socket.connected).map(player => player.getPlayerData());
      io.to(`${region.regionName}-${area.areaNumber}`).emit('playersUpdate', playerUpdates);
    }
  }
}

function sendLeaderboardUpdate(io) {
  const leaderboardData = [];
  for (const region of Object.values(server.regions)) {
    for (const area of region.getLoadedAreas()) {
      for (const player of area.players) {
        leaderboardData.push({
          id: player.id,
          name: player.name,
          regionName: region.regionName,
          areaNumber: area.areaNumber,
          color: player.color,
          score: player.score
        });
      }
    }
  }

  leaderboardData.sort((a, b) => b.areaNumber - a.areaNumber || b.score - a.score);

  io.emit('leaderboardUpdate', leaderboardData);
}

module.exports = {
  ioHandler: (io) => {
    function setupSocketListeners(socket, player) {
      socket.on('spawn', data => handleSpawn(socket, player, data));
      socket.on('playerInput', input => handlePlayerInput(player, input));
      socket.on('abilityUse', abilityNumber => handleAbilityUse(player, abilityNumber));
      socket.on('upgrade', upgradeNumber => handleUpgrade(socket, player, upgradeNumber));
      socket.on('chat', message => handleChat(player, message));
      socket.on('disconnect', () => handleDisconnect(player));
    }

    function handleSpawn(socket, player, { nickname, hero }) {
      player.name = nickname;
      player.heroType = heroType.find(h => h.name === hero)?.id || 0;
      let currentArea = getOrLoadArea(player.regionName, player.areaNumber);
      player.position = player.getRandomSpawnPosition(currentArea);

      sendInitialData(socket, player, currentArea);
      if (!currentArea.players.includes(player)) {
        currentArea.players.push(player);
      }
      player.socket.join(player.regionName + '-' + player.areaNumber);
      sendLeaderboardUpdate(io);
    }

    function handlePlayerInput(player, input) {
      let currentArea = getOrLoadArea(player.regionName, player.areaNumber);
      player.handleInput(input, currentArea);
    }

    function handleAbilityUse(player, abilityNumber) {
      if (!player.abilities[abilityNumber] || player.deathTimer !== -1) return;
      const currentArea = getOrLoadArea(player.regionName, player.areaNumber);
      player.abilities[abilityNumber].use(player, currentArea);
    }

    const UPGRADE_COOLDOWN = 30;
    let lastUpgradeTime = 0;

    function handleUpgrade(socket, player, upgradeNumber) {
      const currentTime = Date.now();
      if (currentTime - lastUpgradeTime < UPGRADE_COOLDOWN) return;

      const updatedProperties = performUpgrade(player, upgradeNumber);

      if (Object.keys(updatedProperties).length > 0) {
        socket.emit('heroUpdate', updatedProperties);
        lastUpgradeTime = currentTime;
      }
    }

    function handleChat(player, message) {
      io.emit('chat', player.name, message, player.color);
    }

    function handleDisconnect(player) {
      const client = server.clients.find(c => c.player.id === player.id);
      if (client) {
        const index = server.clients.indexOf(client);
        server.clients.splice(index, 1);
        log("INFO", `Client ${player.id} disconnected`);

        let currentArea = getOrLoadArea(player.regionName, player.areaNumber);
        if (currentArea) {
          const playerIndex = currentArea.players.indexOf(player);
          if (playerIndex !== -1) {
            currentArea.players.splice(playerIndex, 1);
          }
          io.emit('playerDisconnected', player.id);
        }
        sendLeaderboardUpdate(io);
      }
    }

    function getOrLoadArea(regionName, areaNumber) {
      let area = server.regions[regionName].getArea(areaNumber);
      if (!area) {
        server.regions[regionName].loadArea(areaNumber);
        area = server.regions[regionName].getArea(areaNumber);
      }
      return area;
    }

    function sendInitialData(socket, player, currentArea) {
      socket.emit('areaData', currentArea.getAreaData());
      socket.emit('selfId', player.id);
      socket.emit('playerUpdate', player.getPlayerData());
      socket.to(`${player.regionName}-${player.areaNumber}`).emit('newPlayer', player.getPlayerData());

      const existingPlayers = currentArea.players
        .filter(p => p.id !== player.id)
        .map(p => ({
          id: p.id,
          x: p.position.x,
          y: p.position.y,
          radius: p.radius,
          speed: p.baseSpeed,
          color: p.color,
          name: p.name
        }));
      socket.emit('existingPlayers', existingPlayers);
    }

    function performUpgrade(player, upgradeNumber) {
      const updatedProperties = {};
      const stats = 3;
      const abilities = player.abilities.length;

      if (upgradeNumber === 0 && player.baseSpeed < config.upgrades.maxSpeed) {
        player.baseSpeed += 0.5;
        updatedProperties.speed = player.baseSpeed;
      } else if (upgradeNumber === 1 && player.maxEnergy < config.upgrades.maxEnergy) {
        player.maxEnergy += 5;
        updatedProperties.maxEnergy = player.maxEnergy;
      } else if (upgradeNumber === 2 && player.energyRegen < config.upgrades.maxEnergyRegen) {
        player.energyRegen += 0.5;
        updatedProperties.energyRegen = player.energyRegen;
      } else if (player.abilities[upgradeNumber - stats - 1]) {
        player.abilities[upgradeNumber - abilities - 1].upgrade();
        updatedProperties.abilities = player.abilities.map(ability => ability.getData());
      }

      return updatedProperties;
    }

    io.on("connection", socket => {
      const client = new Client(socket, socket.request);
      const player = client.player;
      log("INFO", `Client ${player.id} connected`);
    
      setupSocketListeners(socket, player);
    });

    return {
      sendPlayerUpdates: () => sendPlayerUpdates(io),
      sendLeaderboardUpdate: () => sendLeaderboardUpdate(io)
    };
  },
  sendPlayerUpdates,
  sendLeaderboardUpdate
};