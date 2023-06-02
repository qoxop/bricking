require('@bricking/common-config');

module.exports = {
  ignorePatterns: ['temp.js', '**/vendor/*.js', '*.min.js', 'dist/**/*.js'],
  extends: [
    './node_modules/@bricking/common-config/eslint/default.js',
  ],
  parserOptions: { tsconfigRootDir: __dirname },
};
