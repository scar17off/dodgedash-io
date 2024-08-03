const fs = require('fs');
const path = require('path');

const abilities = {};
const files = fs.readdirSync(__dirname);

files.forEach(file => {
  if (file !== 'Abilities.js' && file.endsWith('.js')) {
    const abilityName = path.basename(file, '.js');
    abilities[abilityName] = require(`./${file}`);
  }
});

module.exports = abilities;