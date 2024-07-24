const path = require('path');

module.exports = {
  paths: function (paths) {
    paths.appBuild = path.resolve(__dirname, "../public/");
    return paths;
  },
};