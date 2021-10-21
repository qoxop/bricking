import { RollupOptions, OutputOptions } from 'rollup';
import { Configs } from './types';
export declare function rollupConfig(configs: Configs, isApp?: boolean): {
    inputConfig: RollupOptions;
    outputConfig: OutputOptions;
};
