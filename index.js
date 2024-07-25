const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const config = require("./config.json");

const Player = require("./modules/player/Player");
const Area = require("./modules/Area");
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

// Load areas from JSON file
const areasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules', 'areas.json'), 'utf8'));

// Initialize areas
const areas = {};
for (const [regionName, regionData] of Object.entries(areasData)) {
  areas[regionName] = [];
  for (const [areaNumber, areaData] of Object.entries(regionData.areas)) {
    const area = new Area({ ...areaData, position: regionData.position }, regionName, parseInt(areaNumber));
    areas[regionName].push(area);
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
  });

  socket.on('playerInput', (input) => {
    player.handleInput(input);
  });

  socket.on('disconnect', () => {
    const index = server.clients.indexOf(player);
    if (index !== -1) {
      server.clients.splice(index, 1);
    }
  });

  socket.on('changeArea', (direction) => {
    const currentRegion = areas[player.regionName];
    let newAreaNumber = player.areaNumber;

    if (direction === 'next' && player.areaNumber < currentRegion.length - 1) {
      newAreaNumber++;
    } else if (direction === 'previous' && player.areaNumber > 0) {
      newAreaNumber--;
    }

    if (newAreaNumber !== player.areaNumber) {
      // Remove player from current area
      const currentArea = currentRegion[player.areaNumber];
      const playerIndex = currentArea.players.indexOf(player);
      if (playerIndex !== -1) {
        currentArea.players.splice(playerIndex, 1);
      }

      // Update player's area number
      player.areaNumber = newAreaNumber;

      // Add player to new area
      const newArea = currentRegion[newAreaNumber];
      newArea.players.push(player);

      // Calculate the relative Y position
      const relativeY = (player.position.y - currentArea.position.y) / currentArea.size.height;

      // Set player's new position
      const teleportZoneWidth = 50; // Assuming the teleport zone width is 50
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

      // Send updated area data and player position to the client
      socket.emit('areaData', newArea.getAreaData());
      socket.emit('playerUpdate', {
        x: player.position.x,
        y: player.position.y,
        areaNumber: player.areaNumber
      });
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/protocol", (req, res) => {
  res.sendFile(__dirname + "/modules/protocol.json");
});

const gameLoop = () => {
  for (const regionAreas of Object.values(areas)) {
    for (const area of regionAreas) {
      for (const player of area.players) {
        player.update(area);
        const playerData = {
          x: player.position.x,
          y: player.position.y,
          radius: player.radius,
          speed: player.isInStartZone(area) ? 10 : player.baseSpeed,
          color: player.color,
          name: player.name
        };
        player.socket.emit('playerUpdate', playerData);
        player.socket.broadcast.emit('playerMove', { id: player.id, ...playerData });
        
        if (player.isInFinishZone(area)) {
          player.socket.emit('changeArea', 'next');
        } else if (area.previousAreaZone && player.isInPreviousAreaZone(area)) {
          player.socket.emit('changeArea', 'previous');
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

  setTimeout(gameLoop, 1000 / 60); // Run at 60 FPS
};
gameLoop();

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});