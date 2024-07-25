import socket from './network';

export function setupControls(canvas) {
  const controls = {
    mouse: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false },
    mouseMovement: false
  };

  canvas.addEventListener('mousemove', (e) => {
    controls.mouse.x = e.clientX - canvas.width / 2;
    controls.mouse.y = e.clientY - canvas.height / 2;
    socket.emit('mouseMove', { x: controls.mouse.x, y: controls.mouse.y });
  });

  window.addEventListener('keydown', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      controls.keys[e.key.toLowerCase()] = true;
      socket.emit('keyPress', { key: e.key.toLowerCase(), pressed: true });
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      controls.keys[e.key.toLowerCase()] = false;
      socket.emit('keyPress', { key: e.key.toLowerCase(), pressed: false });
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    controls.mouseMovement = !controls.mouseMovement;
    socket.emit('toggleMouseMovement', controls.mouseMovement);
  });

  return controls;
}