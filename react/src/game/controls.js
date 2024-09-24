import socket from './network';

export function setupControls(canvas) {
  const controls = {
    mouse: { x: 0, y: 0 },
    keys: {},
    mouseMovement: false,
    upgradeKeys: {}
  };

  const keyMap = {
    'KeyW': 'w',
    'KeyA': 'a',
    'KeyS': 's',
    'KeyD': 'd',
    'KeyZ': 'ability1',
    'KeyX': 'ability2'
  };

  const upgradeKeyMap = {
    'Digit1': 0,
    'Digit2': 1,
    'Digit3': 2,
    'Digit4': 3,
    'Digit5': 4
  };

  canvas.addEventListener('mousemove', (e) => {
    controls.mouse.x = e.clientX - canvas.width / 2;
    controls.mouse.y = e.clientY - canvas.height / 2;
    socket.emit('mouseMove', { x: controls.mouse.x, y: controls.mouse.y });
  });

  window.addEventListener('keydown', (e) => {
    const key = keyMap[e.code];
    const upgradeIndex = upgradeKeyMap[e.code];

    if (key && !controls.keys[key]) {
      controls.keys[key] = true;
      socket.emit('keyPress', { key, pressed: true });

      const abilityMatch = key.match(/^ability(\d)$/);
      if (abilityMatch) {
        socket.emit('abilityUse', parseInt(abilityMatch[1]) - 1);
      }
    }

    if (upgradeIndex !== undefined && !controls.upgradeKeys[e.code]) {
      controls.upgradeKeys[e.code] = true;
      socket.emit('upgrade', upgradeIndex);
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = keyMap[e.code];
    const upgradeIndex = upgradeKeyMap[e.code];

    if (key && controls.keys[key]) {
      controls.keys[key] = false;
      socket.emit('keyPress', { key, pressed: false });
    }

    if (upgradeIndex !== undefined) {
      controls.upgradeKeys[e.code] = false;
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    controls.mouseMovement = !controls.mouseMovement;
    socket.emit('toggleMouseMovement', controls.mouseMovement);
  });

  return controls;
}