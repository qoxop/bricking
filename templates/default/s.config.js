/**
 * systemjs runtime module 配置文件
 * 更多配置说明请参考 https://git.myscrm.cn/yued/sys-rtm
 */

module.exports = {
    bootstrap: './src/app.tsx',
    entry: './mytodo/index.tsx',
    output: "./dist",
    minimize: true,
}