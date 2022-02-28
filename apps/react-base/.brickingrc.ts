import { updateOptions } from '@bricking/create-base/options';

updateOptions({
    output: 'dist',
    bundle: {
        pack: true,
        dependencies: {
            autoInject: true,
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