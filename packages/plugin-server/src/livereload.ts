import chokidar from 'chokidar';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';

const WS_PATH = '/bricking-ws';

function createWss(app: ReturnType<typeof express>) {
  let wsPool: WebSocket[] = [];
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    if (request.url) {
      const { pathname } = new URL(request.url);
      if (pathname === WS_PATH) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    }
  });
  app.listen = (...args) => server.listen(...args);
  wss.on('connection', (ws) => {
    wsPool.push(ws);
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.action !== 'reload' || msg.type !== 'proxy') return;
        wsPool.forEach((_ws) => _ws.send(JSON.stringify({ action: 'reload' })));
      } catch (err) {
        console.error(err);
      }
    });
    ws.on('error', () => {
      wsPool = wsPool.filter((_ws) => _ws !== ws);
    });
  });
  return wss;
}

function createEmitter(port: number) {
  const ws: WebSocket = new WebSocket(`ws://localhost:${port}${WS_PATH}`);
  ws.on('open', () => {
    console.log('[WEB_SOCKET CLIENT] open()');
  });
  const emitReload = () => {
    try {
      ws.send(JSON.stringify({ action: 'reload', type: 'proxy' }));
    } catch (err) {
      console.error(err);
    }
  };
  return { emitReload };
}

function initWatcher(option: {
  dir: string|string[];
  wsPort: number;
}) {
  const { dir, wsPort } = option;
  const bc = createEmitter(wsPort);
  return chokidar.watch(dir, {
    ignoreInitial: true,
    ignored: [
      /\/node_modules\//,
      /\.git\//,
      /\.svn\//,
      /\.hg\//,
      /\.txt$/,
      /\.d\.ts$/,
    ],
  }).on('add', bc.emitReload)
    .on('change', bc.emitReload)
    .on('unlink', bc.emitReload);
}

export {
  initWatcher,
  createEmitter,
  createWss,
};
