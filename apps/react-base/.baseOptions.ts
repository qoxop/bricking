import { updateOptions } from '@bricking/create-base';

updateOptions({
    cwd: __dirname,
    bundle: {
        autoCode: true,
        moduleRecord: {
            'store': './store/index.ts',
            'layout': './layout/index.ts',
            'utils': './utils/index.ts',
        },
        dependencies: {
            sync: ['react-dom', 'react'],
            exclude: [],
        }
    }
});