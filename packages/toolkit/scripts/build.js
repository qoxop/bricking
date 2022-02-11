const path = require("path");
const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");
const ts = require('typescript');
const del = require('del')



const runBuild = async () => {
    await del(path.resolve(__dirname, '../dist'));
    // bundle
    require("esbuild").build({
        entryPoints: [path.resolve(__dirname,'../index.ts')],
        bundle: true,
        platform: 'node',
        target: 'node12',
        external: Object.keys(require('../package.json').dependencies),
        outfile: path.resolve(__dirname, '../dist/index.js'),
    });

    const tempdir = path.posix.resolve(__dirname, '../temp');

    // generate .d.ts
    ts.createProgram({
        rootNames: [path.resolve(__dirname, '../index.ts')],
        options: {
            outDir: tempdir,
            emitDeclarationOnly: true,
            esModuleInterop: true,
            declaration: true,
            skipLibCheck: true
        }
    }).emit();


    // Run  API Extractor
    Extractor.invoke(
        // load config
        ExtractorConfig.loadFileAndPrepare(
            path.join(__dirname, '../api-extractor.json')
        ),
        // options 
        {
            localBuild: true,
            showVerboseMessages: true
        }
    );
    await del(tempdir);
};

runBuild();


