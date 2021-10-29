/**
 * systemjs runtime module 配置文件
 * 更多配置说明请参考 https://github.com/qoxop/bricking
 */
import { mfConfig } from 'bricking';

export default mfConfig({
    bootstrap: './src/app.tsx',
    entry: './mytodo/index.tsx',
    output: "./dist",
    minimize: true,
})