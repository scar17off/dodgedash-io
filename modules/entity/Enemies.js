const fs = require('fs');
const path = require('path');

const entities = {};
const files = fs.readdirSync(__dirname);

files.forEach(file => {
  if (file !== 'Enemies.js' && file !== 'Entity.js' && file.endsWith('.js')) {
    const entityName = path.basename(file, '.js');
    entities[entityName] = require(`./${file}`);
  }
});

module.exports = entities;