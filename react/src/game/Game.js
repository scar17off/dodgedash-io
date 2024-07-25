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
    localPlayer: { x: 0, y: 0, speed: 5, radius: 25, name: nickname },
    players: [],
    entities: [],
    area: null
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
      updateGameState(prevState => ({ ...prevState, area: areaData }));
      setAreaDataReceived(true);
    });

    socket.on('playerData', (playerData) => {
      updateGameState(prevState => ({
        ...prevState,
        localPlayer: { ...prevState.localPlayer, ...playerData }
      }));
    });

    socket.on('playerUpdate', (playerData) => {
      updateGameState(prevState => ({
        ...prevState,
        localPlayer: { ...prevState.localPlayer, ...playerData }
      }));
    });

    socket.on('entityUpdate', (entityData) => {
      updateGameState(prevState => ({ ...prevState, entities: entityData }));
    });

    socket.on('changeArea', (direction) => {
      socket.emit('changeArea', direction);
    });

    socket.on('newPlayer', (playerData) => {
      updateGameState(prevState => ({
        ...prevState,
        players: [...prevState.players, playerData]
      }));
    });

    socket.on('existingPlayers', (players) => {
      updateGameState(prevState => ({
        ...prevState,
        players: players
      }));
    });

    socket.on('playerMove', (playerData) => {
      updateGameState(prevState => ({
        ...prevState,
        players: prevState.players.map(p => 
          p.id === playerData.id ? { ...p, ...playerData } : p
        )
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
      rendererRef.current.render(currentGameState, { grid: true });

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      socket.off('areaData');
      socket.off('playerData');
      socket.off('playerUpdate');
      socket.off('entityUpdate');
      socket.off('newPlayer');
      socket.off('existingPlayers');
      socket.off('playerMove');
    };
  }, [nickname, hero, updateGameState]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export default Game;