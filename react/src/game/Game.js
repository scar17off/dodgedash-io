import React, { useEffect, useRef } from 'react';

const Game = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

export default Game;