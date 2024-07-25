import React, { useEffect, useRef, useState } from 'react';
import { setupControls } from './controls';
import socket from './network';
import Camera from './camera';
import Renderer from './renderer';

const Game = ({ nickname, hero }) => {
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [gameState, setGameState] = useState({
    localPlayer: { x: 0, y: 0, speed: 5, radius: 25, name: nickname },
    players: [],
    area: null
  });
  const gameStateRef = useRef(gameState);

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
      setGameState(prevState => {
        const newState = { ...prevState, area: areaData };
        gameStateRef.current = newState;
        return newState;
      });
    });

    socket.on('playerUpdate', (playerData) => {
      setGameState(prevState => {
        const newState = { ...prevState, localPlayer: { ...prevState.localPlayer, ...playerData } };
        gameStateRef.current = newState;
        return newState;
      });
    });

    const gameLoop = () => {
      const { mouse, keys, mouseMovement } = controlsRef.current;

      socket.emit('playerInput', { mouse, keys, mouseMovement });

      cameraRef.current.update(gameStateRef.current.localPlayer.x, gameStateRef.current.localPlayer.y);
      rendererRef.current.render(gameStateRef.current, { grid: true });

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nickname, hero]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

export default Game;