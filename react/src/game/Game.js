import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setupControls } from './controls';
import socket from './network';
import Camera from './camera';
import Renderer from './renderer';
import HeroPanel from './HeroPanel';
import Chat from './Chat.js';
import Leaderboard from './Leaderboard';

const Game = ({ nickname, hero }) => {
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const lastSentInputRef = useRef(null);
  const initialState = {
    localPlayer: {
      heroType: hero,
      position: { x: 0, y: 0 },
      speed: 0,
      radius: 0,
      energy: 0,
      maxEnergy: 0,
      energyRegen: 0,
      name: nickname,
      regionName: 'Unknown',
      areaNumber: 0
    },
    players: [],
    entities: [],
    abilityCreations: [],
    area: null,
    selfId: null
  };
  const gameStateRef = useRef(initialState);
  const [gameState, setGameState] = useState(initialState);
  const [messages, setMessages] = useState([]); // Add this state

  const updateGameState = useCallback((updater) => {
    setGameState(prevState => {
      const newState = updater(prevState);
      gameStateRef.current = newState;
      window.gameState = gameStateRef.current;
      return newState;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    controlsRef.current = setupControls(canvas);
    cameraRef.current = new Camera(canvas.width, canvas.height);
    rendererRef.current = new Renderer(context, cameraRef.current, { grid: true, darkMode: true, enemyOutline: false });

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cameraRef.current = new Camera(canvas.width, canvas.height);
      rendererRef.current = new Renderer(context, cameraRef.current, { grid: true, darkMode: true, enemyOutline: false });
    };

    window.addEventListener('resize', handleResize);

    const handleWheel = (e) => {
      if (e.deltaY < 0) {
        cameraRef.current.zoomIn();
      } else {
        cameraRef.current.zoomOut();
      }
    };

    canvas.addEventListener('wheel', handleWheel);

    socket.emit('spawn', { nickname, hero });

    socket.on('areaData', (areaData) => {
      if (!areaData) {
        console.warn('Received null or undefined area data');
      } else if (typeof areaData !== 'object') {
        console.warn('Received invalid area data type:', typeof areaData);
      } else if (!areaData.position || !areaData.size) {
        console.warn('Received incomplete area data:', areaData);
      }
      updateGameState(prevState => ({ ...prevState, area: areaData }));
    });

    socket.on('playersUpdate', (playersData) => {
      updateGameState(prevState => {
        const localPlayer = playersData.find(p => p.id === prevState.selfId);
        const otherPlayers = playersData.filter(p => p.id !== prevState.selfId);

        return {
          ...prevState,
          localPlayer: localPlayer ? { ...prevState.localPlayer, ...localPlayer } : prevState.localPlayer,
          players: otherPlayers.map(player => ({
            ...player,
            position: {
              x: player.position.x,
              y: player.position.y
            }
          }))
        };
      });
    });

    socket.on('selfId', (selfId) => {
      updateGameState(prevState => ({ ...prevState, selfId }));
    });

    socket.on('entityUpdate', (entityData) => {
      updateGameState(prevState => ({ ...prevState, entities: entityData }));
    });

    socket.on('abilityCreationUpdate', (abilityCreations) => {
      updateGameState(prevState => ({ ...prevState, abilityCreations }));
    });

    socket.on('areaChanged', ({ areaData, playerUpdate }) => {
      updateGameState(prevState => ({
        ...prevState,
        area: areaData,
        localPlayer: { ...prevState.localPlayer, ...playerUpdate },
        players: []
      }));
    });

    socket.on('playerLeft', (playerId) => {
      updateGameState(prevState => ({
        ...prevState,
        players: prevState.players.filter(p => p.id !== playerId)
      }));
    });

    socket.on('playerJoined', (playerData) => {
      updateGameState(prevState => {
        if (playerData.areaNumber === prevState.localPlayer.areaNumber) {
          return {
            ...prevState,
            players: [...prevState.players, playerData]
          };
        }
        return prevState;
      });
    });

    socket.on('newPlayer', (playerData) => {
      updateGameState(prevState => {
        if (playerData.areaNumber === prevState.localPlayer.areaNumber) {
          return {
            ...prevState,
            players: [...prevState.players, playerData]
          };
        }
        return prevState;
      });
    });

    socket.on('existingPlayers', (players) => {
      updateGameState(prevState => ({
        ...prevState,
        players: players.filter(p => p.areaNumber === prevState.localPlayer.areaNumber)
      }));
    });

    socket.on('playerMove', (playerData) => {
      updateGameState(prevState => ({
        ...prevState,
        players: prevState.players.map(p =>
          p.id === playerData.id ? { ...p, ...playerData, lastUpdate: Date.now() } : p
        )
      }));
    });

    socket.on('playerDisconnected', (playerId) => {
      updateGameState(prevState => ({
        ...prevState,
        players: prevState.players.filter(p => p.id !== playerId)
      }));
    });

    socket.on('chat', (playerName, message, color) => {
      setMessages(prevMessages => [...prevMessages, { playerName, message, color }]);
    });

    socket.on('heroUpdate', (updatedProperties) => {
      updateGameState(prevState => ({
        ...prevState,
        localPlayer: { ...prevState.localPlayer, ...updatedProperties }
      }));
    });

    const gameLoop = () => {
      const { mouse, keys, mouseMovement } = controlsRef.current;
      const currentInput = { keys, mouseMovement, mouse };

      if (controlsRef.current.inputChanged || !isEqual(currentInput, lastSentInputRef.current)) {
        socket.emit('playerInput', currentInput);
        lastSentInputRef.current = JSON.parse(JSON.stringify(currentInput));
        controlsRef.current.inputChanged = false;
      }

      const currentGameState = gameStateRef.current || initialState;
      if (currentGameState.localPlayer) {
        cameraRef.current.update(currentGameState.localPlayer.position.x, currentGameState.localPlayer.position.y);
      }

      rendererRef.current.render(currentGameState);

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('wheel', handleWheel);
      socket.off('areaData');
      socket.off('entityUpdate');
      socket.off('areaChanged');
      socket.off('playerLeft');
      socket.off('playerJoined');
      socket.off('selfId');
      socket.off('newPlayer');
      socket.off('existingPlayers');
      socket.off('playerMove');
      socket.off('playerDisconnected');
      socket.off('chat');
    };
  }, [nickname, hero, updateGameState]);

  const sendMessage = useCallback((message) => {
    socket.emit('chat', message);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <HeroPanel localPlayer={gameState.localPlayer} />
      <Chat messages={messages} sendMessage={sendMessage} />
      <Leaderboard />
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export default Game;