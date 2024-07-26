const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const config = require("./config.json");

const Player = require("./modules/player/Player");
const Region = require("./modules/Region");
const { heroType } = require("./modules/protocol.json");

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
  clients: [],
  areas: []
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

const areasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules', 'regions.json'), 'utf8'));

// Initialize areas
const areas = {};
for (const [regionName, regionData] of Object.entries(areasData)) {
  areas[regionName] = [];
  for (const [areaNumber, areaData] of Object.entries(regionData.areas)) {
    const region = new Region({ ...areaData, position: regionData.position }, regionName, parseInt(areaNumber));
    areas[regionName].push(region);
  }
}

io.on("connection", socket => {
  const player = new Player(socket, "Alpha", 0);
  
  socket.on('spawn', ({ nickname, hero }) => {
    player.name = nickname;
    player.heroType = heroType.find(h => h.name === hero)?.id || 0;
    server.clients.push(player);
    const currentArea = areas[player.regionName][player.areaNumber];
    currentArea.players.push(player);
    player.position = player.getRandomSpawnPosition(currentArea);
    
    const areaData = currentArea.getAreaData();
    socket.emit('areaData', areaData);

    const playerData = {
      id: player.id,
      x: player.position.x,
      y: player.position.y,
      radius: player.radius,
      speed: player.baseSpeed,
      color: player.color,
      name: player.name
    };
    socket.emit('playerData', playerData);

    socket.broadcast.emit('newPlayer', playerData);

    const existingPlayers = server.clients
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
    player.handleInput(input);
  });

  socket.on('disconnect', () => {
    const index = server.clients.indexOf(player);
    if (index !== -1) {
      server.clients.splice(index, 1);
      
      // Remove player from the current area
      const currentArea = areas[player.regionName][player.areaNumber];
      const playerIndex = currentArea.players.indexOf(player);
      if (playerIndex !== -1) {
        currentArea.players.splice(playerIndex, 1);
      }
      
      // Notify all players about the disconnection
      io.emit('playerDisconnected', player.id);
    }
  });
});

const gameLoop = () => {
  for (const regionAreas of Object.values(areas)) {
    for (const area of regionAreas) {
      for (const player of area.players) {
        player.update(area);
        const playerData = {
          id: player.id,
          x: player.position.x,
          y: player.position.y,
          radius: player.radius,
          speed: player.isInStartZone(area) || player.isInFinishZone(area) ? 10 : player.baseSpeed,
          color: player.color,
          name: player.name
        };
        player.socket.emit('playerUpdate', playerData);
        player.socket.to(area.regionName + '-' + area.areaNumber).emit('playerMove', playerData);
        
        if (player.isInNextAreaZone(area)) {
          changePlayerArea(player, 'next');
        } else if (area.previousAreaZone && player.isInPreviousAreaZone(area)) {
          changePlayerArea(player, 'previous');
        }
      }

      const entityData = area.entities.map(entity => ({
        x: entity.position.x,
        y: entity.position.y,
        radius: entity.radius,
        color: entity.color,
        entityType: entity.entityType
      }));

      for (const player of area.players) {
        player.socket.emit('entityUpdate', entityData);
      }

      for (const entity of area.entities) {
        entity.update(area);
      }
    }
  }

  setTimeout(gameLoop, 1000 / config.fps);
};

function changePlayerArea(player, direction) {
  const currentRegion = areas[player.regionName];
  let newAreaNumber = player.areaNumber;
  if (direction === 'next' && player.areaNumber < currentRegion.length - 1) {
    newAreaNumber++;
  } else if (direction === 'previous' && player.areaNumber > 0) {
    newAreaNumber--;
  }
  if (newAreaNumber !== player.areaNumber) {
    const currentArea = currentRegion[player.areaNumber];
    const playerIndex = currentArea.players.indexOf(player);
    if (playerIndex !== -1) {
      currentArea.players.splice(playerIndex, 1);
    }
    player.areaNumber = newAreaNumber;
    const newArea = currentRegion[newAreaNumber];
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
    
    player.socket.emit('areaChanged', {
      areaData: newArea.getAreaData(),
      playerUpdate: {
        x: player.position.x,
        y: player.position.y,
        areaNumber: player.areaNumber
      }
    });

    // Send updated entity data for the new area
    const entityData = newArea.entities.map(entity => ({
      x: entity.position.x,
      y: entity.position.y,
      radius: entity.radius,
      color: entity.color,
      entityType: entity.entityType
    }));
    player.socket.emit('entityUpdate', entityData);

    player.socket.leave(player.regionName + '-' + currentArea.areaNumber);
    player.socket.join(player.regionName + '-' + newAreaNumber);

    // Notify other players about the player leaving and joining
    player.socket.to(player.regionName + '-' + currentArea.areaNumber).emit('playerLeft', player.id);
    player.socket.to(player.regionName + '-' + newAreaNumber).emit('playerJoined', {
      id: player.id,
      x: player.position.x,
      y: player.position.y,
      radius: player.radius,
      speed: player.baseSpeed,
      color: player.color,
      name: player.name
    });
  }
}

gameLoop();

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});