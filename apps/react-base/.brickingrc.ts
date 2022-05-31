import { updateOptions } from "@bricking/base-builder";

updateOptions({
    output: 'dist',
    publicPath: 'http://localhost:9001/',
    devServer: {
        port: '9001'
    },
    bundle: {
        pack: true,
        dependencies: {
            autoInject: true,
            exclude: ['lodash']
        },
        moduleDefines: {
            output: 'types',
            autoInject: true,
            defines: {
                'index': './src/index.ts',
                'store': './src/store',
                'layout': './src/layout',
                'utils': './src/utils',
            }
        }
    }
});