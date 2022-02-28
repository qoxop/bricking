import {
    Compilation,
    Compiler
} from "webpack";
// import typesPack from "./types-pack";
import { getUserOptions } from "../options";
import { btkFile } from "@bricking/toolkit/dist";
import path from "path";

/**
 * webpack 插件：用于构建 SDK
 */
const PLUGIN_NAME = 'BRICKING_PACK_PLUGIN';
const { Zipper } = btkFile;

export default class BrickingPackPlugin {
    options = getUserOptions();
    getBundleFilename(compilation: Compilation) {
        for (const [name, entry] of compilation.entrypoints) {
            if (name === 'bricking') {
                return entry.getFiles().find(filename => (
                    /^base-js-bricking\.\w+\.js$/.test(filename) ||
                    filename === 'base-js-bundle.js'
                ))
            }
        }
    }
    apply(compiler: Compiler) {
        const webpack = compiler.webpack;

        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tapAsync({
                    name: PLUGIN_NAME,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                async (assets, callback) => {
                    // const bundleFilename = this.getBundleFilename(compilation);
                    // const typesPackPath = typesPack();
                    console.log(compiler.outputPath)
                    const zipper = new Zipper(path.resolve(compiler.outputPath, 'pack.zip'));
                    Object.entries(assets).forEach(([name, value]) => {
                        const source = value.source();
                        const buff = Buffer.isBuffer(source) ? source : Buffer.from(source);
                        zipper.add(name, buff)
                    });
                    await zipper.finish();
                    // JSON.stringify({
                    //     serve: '/',
                    //     bundle: '',
                    //     typesPack: '',
                    //     bundlePack: '',
                    // }, null, '\t')

                    callback();
                }
            );
        });
    }
}