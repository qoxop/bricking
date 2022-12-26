import { dirname } from 'path';
import { Plugin } from 'rollup';
import { startServe, ServeConfig } from './server';

const PLUGIN_NAME = 'rollup-livereload-server';
const LIVE_RELOAD_SCRIPT = 'bricking-livereload.js';

const getScriptCode = (host: string, port: number, p: string) => `(function() {
  var wsUrl = 'ws://${host}:${port}${p}'
  var ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    console.log('connected to ' + wsUrl)
  }
  ws.onmessage = (data) => {
    try {
      const msg = JSON.parse(data.data.toString());
      if (msg.action === 'reload') {
        window.location.reload();
      }
    } catch (error) {
      console.warn(error);
    }
  }
})();
`;

export function livereloadServer(options: ServeConfig):Plugin {
  let started = false;
  const runServerOnce = async (dist: string) => {
    if (started) return;
    started = !!(await startServe(options, dist));
  };
  return {
    name: PLUGIN_NAME,
    banner() {
      return '((d) => {'
        + "var id = 'bricking-livereload-script';"
        + 'var e = d.getElementById(id);'
        + `if (!e) { e = d.createElement('script'); e.id = id; e.src = "/${LIVE_RELOAD_SCRIPT}"; d.body.append(e); }`
        + '})(document);';
    },
    generateBundle() {
      this.emitFile({
        fileName: LIVE_RELOAD_SCRIPT,
        type: 'asset',
        source: getScriptCode(options.host, +(process.env.USE_WS_PROXY_PORT || options.port), '/bricking-ws'),
      });
    },
    writeBundle(outputOptions) {
      const dist = outputOptions.dir || dirname(outputOptions.file as string);
      setTimeout(() => {
        runServerOnce(dist);
      }, 1000);
    },
  };
}
