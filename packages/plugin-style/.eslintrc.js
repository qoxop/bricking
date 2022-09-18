require('@bricking/common-config');

module.exports = {
  extends: [
    './node_modules/@bricking/common-config/eslint/default.js',
  ],
  parserOptions: { tsconfigRootDir: __dirname },
};
