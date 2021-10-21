/**
 * systemjs runtime module 配置文件
 * 更多配置说明请参考 https://github.com/qoxop/mf-build
 */
import { mfConfig } from 'mf-build';

export default mfConfig({
    bootstrap: './src/app.tsx',
    entry: './mytodo/index.tsx',
    output: "./dist",
    minimize: true,
})