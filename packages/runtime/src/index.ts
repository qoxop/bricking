import mm from './module-manage';
import injectCss from './inject-css';
import createStorage from './create-storage';

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
