const { btkCompile } = require('@bricking/toolkit');
btkCompile.registerTsHooks();

require('./css').transformTest();
