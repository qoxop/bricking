const path = require('path');
const { startServe } = require('../dist/index');

startServe({
  port: 8080,
  host: 'localhost',
  open: '/'
}, path.join(__dirname, './assets'));