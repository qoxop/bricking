/**
 * systemjs runtime module 配置文件
 * 更多配置说明请参考 https://github.com/qoxop/mf-build
 */

module.exports = {
    bootstrap: './src/app.tsx',
    entry: './mytodo/index.tsx',
    output: "./dist",
    minimize: true,
    sdk: {
        type: 'remote',
        location: 'http://files.codcats.com/mf/SDK.json',
        // realTime: boolean
    }
}