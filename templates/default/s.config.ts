import { mfConfig } from 'bricking';

export default mfConfig({
    entry: './mytodo/index.tsx',
    bootstrap: './src/app.tsx',
    output: "./dist",
    minimize: true,
});