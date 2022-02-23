const { runBuild } = require('@bricking/create-base');
process.env.NODE_ENV = 'production';
runBuild((err) => {
    if (err) {
        console.log('err')
    }
});