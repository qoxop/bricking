const _colors = {
  'bright': '\x1B[1m',
  'grey': '\x1B[2m',
  'black': '\x1B[30m',
  'red': '\x1B[31m',
  'green': '\x1B[32m',
  'yellow': '\x1B[33m',
  'blue': '\x1B[34m',
  'cyan': '\x1B[36m',
  'white': '\x1B[37m'
} as const;

export const colors:Record<keyof typeof _colors, (str: string) => string> = new Proxy({} as any, {
  get(_, property) {
    return (str) => `${_colors[property]}${str}\x1B[0m`;
  }
});
