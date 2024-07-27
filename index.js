const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const config = require("./config.json");

const Region = require("./modules/region/Region");
const Client = require("./modules/player/Client");
const { heroType } = require("./modules/protocol.json");
const areasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules', 'region', 'regions.json'), 'utf8'));

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

global.server = {
  lastId: 0,
  clients: []
}

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

// Initialize regions
const regions = {};
for (const [regionName, regionData] of Object.entries(areasData)) {
  regions[regionName] = new Region(regionData, regionName);
}

function sendPlayerUpdates() {
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      const playerUpdates = area.players.filter(player => player.socket.connected).map(player => player.getPlayerData());
      io.to(`${region.regionName}-${area.areaNumber}`).emit('playersUpdate', playerUpdates);
    }
  }
}

io.on("connection", socket => {
  const client = new Client(socket, socket.request);
  const player = client.player;
  server.clients.push(client);
  
  socket.on('spawn', ({ nickname, hero }) => {
    player.name = nickname;
    player.heroType = heroType.find(h => h.name === hero)?.id || 0;
    let currentArea = regions[player.regionName].getArea(player.areaNumber);
    if (!currentArea) {
      regions[player.regionName].loadArea(player.areaNumber);
      currentArea = regions[player.regionName].getArea(player.areaNumber);
    }
    currentArea.players.push(player);
    player.position = player.getRandomSpawnPosition(currentArea);
    
    const areaData = currentArea.getAreaData();
    socket.emit('areaData', areaData);

    socket.emit('selfId', player.id);

    const playerData = player.getPlayerData();
    socket.emit('playerUpdate', playerData);
    socket.to(`${player.regionName}-${player.areaNumber}`).emit('newPlayer', playerData);

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

    socket.join(player.regionName + '-' + player.areaNumber);
  });

  socket.on('playerInput', (input) => {
    let currentArea = regions[player.regionName].getArea(player.areaNumber);
    if (!currentArea) {
      regions[player.regionName].loadArea(player.areaNumber);
      currentArea = regions[player.regionName].getArea(player.areaNumber);
    }
    player.handleInput(input, currentArea);
    
    // We'll send updates in bulk, so no need to emit here
  });

  socket.on('disconnect', () => {
    const index = server.clients.indexOf(client);
    if (index !== -1) {
      server.clients.splice(index, 1);
      
      // Remove player from the current area
      let currentArea = regions[player.regionName]?.getArea(player.areaNumber);
      if (currentArea) {
        const playerIndex = currentArea.players.indexOf(player);
        if (playerIndex !== -1) {
          currentArea.players.splice(playerIndex, 1);
        }
        
        // Notify players in the same area about the disconnection
        io.emit('playerDisconnected', player.id);
      }
    }
  });
});

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
    let currentArea = currentRegion.getArea(oldAreaNumber);
    if (!currentArea) {
      currentRegion.loadArea(oldAreaNumber);
      currentArea = currentRegion.getArea(oldAreaNumber);
    }

    const playerIndex = currentArea.players.indexOf(player);
    if (playerIndex !== -1) {
      currentArea.players.splice(playerIndex, 1);
    }
    
    // Unload the current area if it's empty
    if (currentArea.players.length === 0) {
      currentRegion.unloadArea(oldAreaNumber);
    }

    player.areaNumber = newAreaNumber;
    let newArea = currentRegion.getArea(newAreaNumber);
    if (!newArea) {
      currentRegion.loadArea(newAreaNumber);
      newArea = currentRegion.getArea(newAreaNumber);
    }
    newArea.players.push(player);

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
    const entityData = newArea.entities.map(entity => ({
      x: entity.position.x,
      y: entity.position.y,
      radius: entity.radius,
      color: entity.color,
      entityType: entity.entityType
    }));
    player.socket.emit('entityUpdate', entityData);

    player.socket.leave(player.regionName + '-' + oldAreaNumber);
    player.socket.join(player.regionName + '-' + newAreaNumber);

    // Notify other players about the player leaving and joining
    io.to(`${player.regionName}-${oldAreaNumber}`).emit('playerLeft', player.id);
    io.to(`${player.regionName}-${newAreaNumber}`).emit('playerJoined', playerData);

    // Send the new list of players in the new area to the player
    const playersInNewArea = newArea.players.filter(p => p.id !== player.id).map(p => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      radius: p.radius,
      speed: p.baseSpeed,
      color: p.color,
      name: p.name,
      areaNumber: newAreaNumber
    }));
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
  }
}

const gameLoop = () => {
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      for (const player of area.players) {
        player.update(area);
        
        // Check if player should change areas
        if (player.isInNextAreaZone(area)) {
          changePlayerArea(player, 'next');
        } else if (area.previousAreaZone && player.isInPreviousAreaZone(area)) {
          changePlayerArea(player, 'previous');
        }
      }

      // Update entities
      for (const entity of area.entities) {
        entity.update(area);
      }
    }
  }

  // Send all player updates at once
  sendPlayerUpdates();

  // Send entity updates
  for (const region of Object.values(regions)) {
    for (const area of region.getLoadedAreas()) {
      const entityData = area.entities.map(entity => ({
        x: entity.position.x,
        y: entity.position.y,
        radius: entity.radius,
        color: entity.color,
        entityType: entity.entityType
      }));
      io.to(`${region.regionName}-${area.areaNumber}`).emit('entityUpdate', entityData);
    }
  }

  setTimeout(gameLoop, 1000 / config.fps);
};
gameLoop();

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});