import { OutputChunk, Plugin } from 'rollup';
import { INJECT_IMPORT_MAPS } from "../code-template";

export default function(import_maps = {}):Plugin {
    return {
        name: 'app-builder',
        async generateBundle(_, bundle) {
            if (import_maps && Object.keys(import_maps).length) {
                const [ _, entryChunk ] = Object.entries(bundle).find(([_, chunk]) => (chunk as OutputChunk).isEntry) as [string, OutputChunk];
                entryChunk.code = INJECT_IMPORT_MAPS(JSON.stringify(import_maps)) + '\n' + entryChunk.code;
            }
        }
    }
}
