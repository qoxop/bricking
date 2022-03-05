import mm from './src/module-manage';
import injectCss from './src/inject-css';
import createStorage from './src/create-storage';

// bricking 的运行时对象
const $bricking = Object.defineProperties({}, {
  mm: {
    get() {
      return mm;
    },
  },
  createStorage: {
    get() {
      return createStorage;
    },
  },
  injectCss: {
    get() {
      return injectCss;
    },
  },
});

Object.defineProperty(window, '$bricking', {
  get() {
    return $bricking;
  },
});
