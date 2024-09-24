const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const config = require("./config.json");

const Region = require("./modules/region/Region");
const Client = require("./modules/player/Client");
const { log } = require("./modules/utils");
const { heroType } = require("./modules/protocol.json");
const areasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules', 'region', 'regions.json'), 'utf8'));

log("INFO", "Starting server...");

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

/**
 * @global
 * @type {Object}
 * @property {number} lastId - The last assigned ID.
 * @property {Array<Object>} clients - The list of connected clients.
 * @property {Object<string, Region>} regions - The regions in the game.
 */
global.server = {
  lastId: 1,
  clients: [],
  regions: {},
  getArea(region, areaNumber) {
    let area = region.getArea(areaNumber);
    if (!area) {
      region.loadArea(areaNumber);
      area = region.getArea(areaNumber);
    }
    return area;
  }
}

const regions = global.server.regions;

function copyProtocolToReact() {
  const sourceFile = path.join(__dirname, 'modules', 'protocol.json');
  const destFile = path.join(__dirname, 'react', 'src', 'protocol.json');

  fs.copyFile(sourceFile, destFile, (err) => {
    if (err) {
      console.error('Error copying protocol.json:', err);
    }
  });
}

copyProtocolToReact();

for (const [regionName, regionData] of Object.entries(areasData)) {
  regions[regionName] = new Region(regionData, regionName);
}

function changePlayerArea(player, direction) {
  const currentRegion = regions[player.regionName];
  const oldAreaNumber = player.areaNumber;
  let newAreaNumber = oldAreaNumber;

  if (direction === 'next' && oldAreaNumber < Object.keys(currentRegion.areasData).length - 1) {
    newAreaNumber++;
  } else if (direction === 'previous' && oldAreaNumber > 0) {
    newAreaNumber--;
  }

  if (newAreaNumber !== oldAreaNumber) {
    const currentArea = server.getArea(currentRegion, oldAreaNumber);

    const playerIndex = currentArea.players.indexOf(player);
    if (playerIndex !== -1) {
      currentArea.players.splice(playerIndex, 1);
    }

    // Unload the current area if it's empty
    if (currentArea.players.length === 0) {
      currentRegion.unloadArea(oldAreaNumber);
    }

    player.areaNumber = newAreaNumber;
    let newArea = server.getArea(currentRegion, newAreaNumber);

    if (!newArea.players.includes(player)) {
      newArea.players.push(player);
    }

    const relativeY = (player.position.y - currentArea.position.y) / currentArea.size.height;
    const teleportZoneWidth = 50;
    const safeDistance = teleportZoneWidth + player.radius;
    if (direction === 'next') {
      player.position = {
        x: newArea.position.x + safeDistance,
        y: newArea.position.y + (relativeY * newArea.size.height)
      };
    } else if (direction === 'previous') {
      player.position = {
        x: newArea.position.x + newArea.size.width - safeDistance,
        y: newArea.position.y + (relativeY * newArea.size.height)
      };
    }

    const playerData = player.getPlayerData();
    player.socket.emit('playerUpdate', playerData);

    // Send updated area data for the new area
    const areaData = newArea.getAreaData();
    player.socket.emit('areaData', areaData);

    // Send updated entity data for the new area
    const entityData = newArea.entities.map(entity => entity.getEntityData());
    player.socket.emit('entityUpdate', entityData);

    player.socket.leave(player.regionName + '-' + oldAreaNumber);
    player.socket.join(player.regionName + '-' + newAreaNumber);

    // Notify other players about the player leaving and joining
    io.to(`${player.regionName}-${oldAreaNumber}`).emit('playerLeft', player.id);
    io.to(`${player.regionName}-${newAreaNumber}`).emit('playerJoined', playerData);

    // Send the new list of players in the new area to the player
    const playersInNewArea = newArea.players.filter(p => p.id !== player.id).map(p => p.getPlayerData());
    player.socket.emit('existingPlayers', playersInNewArea);

    // Emit areaChanged event to the client
    player.socket.emit('areaChanged', {
      areaData: newArea.getAreaData(),
      playerUpdate: playerData
    });

    // Check if any areas should be unloaded
    [oldAreaNumber, newAreaNumber - 1, newAreaNumber + 1].forEach(areaToCheck => {
      if (areaToCheck >= 0 && areaToCheck < Object.keys(currentRegion.areasData).length) {
        const areaToUnload = currentRegion.getArea(areaToCheck);
        if (areaToUnload && areaToUnload.players.length === 0 && areaToCheck !== newAreaNumber) {
          currentRegion.unloadArea(areaToCheck);
        }
      }
    });

    sendLeaderboardUpdate();
  }
}

function sendPlayerUpdates() {
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      const playerUpdates = area.players.filter(player => player.socket.connected).map(player => player.getPlayerData());
      io.to(`${region.regionName}-${area.areaNumber}`).emit('playersUpdate', playerUpdates);
    }
  }
}

function sendLeaderboardUpdate() {
  const leaderboardData = [];
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      for (const player of area.players) {
        leaderboardData.push({
          id: player.id,
          name: player.name,
          regionName: region.regionName,
          areaNumber: area.areaNumber,
          color: player.color
        });
      }
    }
  }

  leaderboardData.sort((a, b) => b.areaNumber - a.areaNumber);

  io.emit('leaderboardUpdate', leaderboardData);
}

io.on("connection", socket => {
  const client = new Client(socket, socket.request);
  const player = client.player;
  log("INFO", `Client ${player.id} connected`);

  socket.on('spawn', ({ nickname, hero }) => {
    player.name = nickname;
    player.heroType = heroType.find(h => h.name === hero)?.id || 0;
    let currentArea = getArea(player.regionName, player.areaNumber);
    player.position = player.getRandomSpawnPosition(currentArea);

    socket.emit('areaData', currentArea.getAreaData());
    socket.emit('selfId', player.id);
    socket.emit('playerUpdate', player.getPlayerData());
    socket.emit('heroUpdate', { abilities: player.abilities }); // Fixes the bug of the abilities not showing up
    socket.to(`${player.regionName}-${player.areaNumber}`).emit('newPlayer', player.getPlayerData());

    const existingPlayers = currentArea.players
      .filter(p => p.id !== player.id)
      .map(p => ({
        id: p.id,
        x: p.position.x,
        y: p.position.y,
        radius: p.radius,
        color: p.color,
        name: p.name
      }));
    socket.emit('existingPlayers', existingPlayers);

    if (!currentArea.players.includes(player)) {
      currentArea.players.push(player);
    }
    socket.join(player.regionName + '-' + player.areaNumber);
    sendLeaderboardUpdate();
  });

  socket.on('playerInput', input => {
    let currentArea = getArea(player.regionName, player.areaNumber);
    player.handleInput(input, currentArea);
  });

  socket.on('abilityUse', abilityNumber => {
    if (!player.abilities[abilityNumber] || player.deathTimer !== -1) return; // if the ability is not defined or the player is dead, do not use it
    if (!player.abilities[abilityNumber].unlocked) return; // If the ability is not unlocked, do not use it
    const currentArea = getArea(player.regionName, player.areaNumber);
    player.abilities[abilityNumber].use(player, currentArea);
  });

  const UPGRADE_COOLDOWN = 30;
  let lastUpgradeTime = 0;

  socket.on('upgrade', upgradeNumber => {
    const currentTime = Date.now();
    if (currentTime - lastUpgradeTime < UPGRADE_COOLDOWN) return;

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
    } else if (upgradeNumber >= stats && upgradeNumber < stats + abilities) {
      const abilityIndex = upgradeNumber - stats;
      if (player.abilities[abilityIndex]) {
        player.abilities[abilityIndex].upgrade();
        updatedProperties.abilities = player.abilities.map(ability => ability.getData());
      }
    }

    if (Object.keys(updatedProperties).length > 0) {
      socket.emit('heroUpdate', updatedProperties);
      lastUpgradeTime = currentTime;
    }
  });

  socket.on('chat', message => {
    io.emit('chat', player.name, message, player.color);
  });

  socket.on('disconnect', () => {
    const client = server.clients.find(c => c.player.id === player.id);
    if (client) {
      const index = server.clients.indexOf(client);
      server.clients.splice(index, 1);
      log("INFO", `Client ${player.id} disconnected`);

      let currentArea = getArea(player.regionName, player.areaNumber);
      if (currentArea) {
        const playerIndex = currentArea.players.indexOf(player);
        if (playerIndex !== -1) {
          currentArea.players.splice(playerIndex, 1);
        }
        io.emit('playerDisconnected', player.id);
      }
      sendLeaderboardUpdate();
    }
  });
});

function getArea(regionName, areaNumber) {
  let area = server.regions[regionName].getArea(areaNumber);
  if (!area) {
    server.regions[regionName].loadArea(areaNumber);
    area = server.regions[regionName].getArea(areaNumber);
  }
  return area;
}

const gameLoop = () => {
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      for (const player of area.players) {
        player.update(area);

        // Update energy
        if (player.energy < player.maxEnergy) {
          player.energy += player.energyRegen / (config.fps / 2);
          const client = server.clients.find(c => c.id === player.id);
          if (client) {
            client.socket.emit('heroUpdate', {
              energy: player.energy
            });
          }
        }

        // Check if player should change areas
        if (player.isInNextAreaZone(area)) {
          changePlayerArea(player, 'next');
        } else if (area.previousAreaZone && player.isInPreviousAreaZone(area)) {
          changePlayerArea(player, 'previous');
        }

        // Timer update and respawn
        if (player.deathTimer !== -1) {
          player.deathTimer = Math.max(0, player.deathTimer - 1000 / (Math.round(config.fps / 1.33)));
          if (player.deathTimer <= 0) {
            const oldAreaNumber = player.areaNumber;
            player.areaNumber = 0;
            player.respawn();
            const client = server.clients.find(c => c.player.id === player.id);
            const socket = client.ws;
            const respawnArea = server.getArea(server.regions[player.regionName], player.areaNumber);

            // Remove player from old area
            const oldArea = server.getArea(server.regions[player.regionName], oldAreaNumber);
            const playerIndex = oldArea.players.indexOf(player);
            if (playerIndex !== -1) {
              oldArea.players.splice(playerIndex, 1);
            }

            // Add player to new area
            if (!respawnArea.players.includes(player)) {
              respawnArea.players.push(player);
            }

            // Update client with new player data
            socket.emit('playerUpdate', player.getPlayerData());
            socket.emit('areaData', respawnArea.getAreaData());
            socket.emit('areaChanged', {
              areaData: respawnArea.getAreaData(),
              playerUpdate: player.getPlayerData()
            });

            // Update room subscriptions
            socket.leave(`${player.regionName}-${oldAreaNumber}`);
            socket.join(`${player.regionName}-${player.areaNumber}`);

            // Notify other players about the respawned player
            socket.to(`${player.regionName}-${player.areaNumber}`).emit('playerJoined', player.getPlayerData());

            // Update the leaderboard
            sendLeaderboardUpdate();
          }
        }

        // Check for collisions with entities in the same area
        for (const entity of area.entities) {
          if (entity.collideCheck(player) && player.deathTimer == -1) {
            player.deathTimer = area.deathTimer * 1000;
            break; // Exit the loop once a collision is detected
          }
        }

        // Check for collisions with other players in the same area
        if (player.deathTimer === -1) {  // Only check collisions if player is alive
          for (const otherPlayer of area.players) {
            if (otherPlayer.id !== player.id && player.collideCheck(otherPlayer)) {
              otherPlayer.deathTimer = -1;
              break; // Exit the loop once a collision is detected
            }
          }
        }
      }

      // Update ability creations
      for (const abilityCreation of area.abilityCreations) {
        abilityCreation.update(area);
      }

      // Update entities
      for (const entity of area.entities) {
        entity.update(area);
      }
    }
  }

  sendPlayerUpdates();

  // Send entity updates
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      const entityData = area.entities.map(entity => entity.getEntityData());
      io.to(`${region.regionName}-${area.areaNumber}`).emit('entityUpdate', entityData);
    }
  }

  // Send ability creation updates
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      const abilityCreationData = area.abilityCreations.map(entity => entity.getCreationData());
      if (abilityCreationData.length > 0) {
        io.to(`${region.regionName}-${area.areaNumber}`).emit('abilityCreationUpdate', abilityCreationData);
      }
    }
  }

  setTimeout(gameLoop, 1000 / config.fps);
};
gameLoop();

httpServer.listen(443, () => {
  log("INFO", "Server is running on port 443");
});