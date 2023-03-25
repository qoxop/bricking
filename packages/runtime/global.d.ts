import type { TBricking } from './dist/index';

declare global {
  export interface Window { $bricking: TBricking; }
}
