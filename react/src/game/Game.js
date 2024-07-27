import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setupControls } from './controls';
import socket from './network';
import Camera from './camera';
import Renderer from './renderer';

const Game = ({ nickname, hero }) => {
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const lastSentInputRef = useRef(null);
  const initialState = {
    localPlayer: { x: 0, y: 0, speed: 0, radius: 0, name: nickname, areaNumber: 0 },
    players: [],
    entities: [],
    area: null,
    selfId: null
  };
  const gameStateRef = useRef(initialState);
  const [gameState, setGameState] = useState(initialState);
  const [areaDataReceived, setAreaDataReceived] = useState(false);

  const updateGameState = useCallback((updater) => {
    setGameState(prevState => {
      const newState = updater(prevState);
      gameStateRef.current = newState;
      return newState;
    });
    window.gameState = gameState;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    controlsRef.current = setupControls(canvas);
    cameraRef.current = new Camera(canvas.width, canvas.height);
    rendererRef.current = new Renderer(context, cameraRef.current);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cameraRef.current = new Camera(canvas.width, canvas.height);
      rendererRef.current = new Renderer(context, cameraRef.current);
    };

    window.addEventListener('resize', handleResize);

    const handleWheel = (e) => {
      if (e.deltaY < 0) {
        cameraRef.current.zoomIn();
      } else {
        cameraRef.current.zoomOut();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        cameraRef.current.toggleZoomLock();
      }
    };

    canvas.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);

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
      setAreaDataReceived(true);
    });

    socket.on('playersUpdate', (playersData) => {
      updateGameState(prevState => {
        const localPlayer = playersData.find(p => p.id === prevState.selfId);
        const otherPlayers = playersData.filter(p => p.id !== prevState.selfId);
        
        return {
          ...prevState,
          localPlayer: localPlayer ? { ...prevState.localPlayer, ...localPlayer } : prevState.localPlayer,
          players: otherPlayers
        };
      });
    });

    socket.on('selfId', (selfId) => {
      updateGameState(prevState => ({ ...prevState, selfId }));
    });

    socket.on('entityUpdate', (entityData) => {
      updateGameState(prevState => ({ ...prevState, entities: entityData }));
    });

    socket.on('areaChanged', ({ areaData, playerUpdate }) => {
      updateGameState(prevState => ({
        ...prevState,
        area: areaData,
        localPlayer: { ...prevState.localPlayer, ...playerUpdate },
        players: [] // Clear other players when changing areas
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
        cameraRef.current.update(currentGameState.localPlayer.x, currentGameState.localPlayer.y);
      }
      
      if (!currentGameState.area) {
        console.warn('Area data is missing in the game state');
      }
      
      rendererRef.current.render(currentGameState, { grid: true });

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      socket.off('areaData');
      socket.off('playerUpdate');
      socket.off('entityUpdate');
      socket.off('areaChanged');
      socket.off('playerLeft');
      socket.off('playerJoined');
      socket.off('newPlayer');
      socket.off('existingPlayers');
      socket.off('playerMove');
      socket.off('playerDisconnected');
    };
  }, [nickname, hero, updateGameState]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export default Game;