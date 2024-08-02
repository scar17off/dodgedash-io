import socket from './network';

export function setupControls(canvas) {
  const controls = {
    mouse: { x: 0, y: 0 },
    keys: {},
    mouseMovement: false
  };

  const keyMap = {
    'KeyW': 'w',
    'KeyA': 'a',
    'KeyS': 's',
    'KeyD': 'd',
    'KeyZ': 'ability1',
    'KeyJ': 'ability1',
    'KeyX': 'ability2',
    'KeyK': 'ability2',
    'Digit1': 'upgrade1',
    'Digit2': 'upgrade2',
    'Digit3': 'upgrade3',
    'Digit4': 'upgrade4',
    'Digit5': 'upgrade5'
  };

  canvas.addEventListener('mousemove', (e) => {
    controls.mouse.x = e.clientX - canvas.width / 2;
    controls.mouse.y = e.clientY - canvas.height / 2;
    socket.emit('mouseMove', { x: controls.mouse.x, y: controls.mouse.y });
  });

  window.addEventListener('keydown', (e) => {
    const key = keyMap[e.code];
    if (key) {
      controls.keys[key] = true;
      socket.emit('keyPress', { key, pressed: true });
      
      const abilityMatch = key.match(/^ability(\d)$/);
      const upgradeMatch = key.match(/^upgrade(\d)$/);

      if (abilityMatch) {
        socket.emit('abilityUse', parseInt(abilityMatch[1]) - 1);
      } else if (upgradeMatch) {
        socket.emit('abilityUpgrade', parseInt(upgradeMatch[1]) - 1);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = keyMap[e.code];
    if (key) {
      controls.keys[key] = false;
      socket.emit('keyPress', { key, pressed: false });
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    controls.mouseMovement = !controls.mouseMovement;
    socket.emit('toggleMouseMovement', controls.mouseMovement);
  });

  return controls;
}