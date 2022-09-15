const fs = require('fs');
const path = require('path');

fs.cp(path.resolve(__dirname, 'packages/'), path.resolve(__dirname,  '_bricking/'), {
  recursive: true,
  filter: (source) => {
    if (/_/.test(source) || /node_modules/.test(source)) {
      return false;
    }
    return true;
  }
}, console.log);