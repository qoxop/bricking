import { defineBricking } from 'bricking';

export default defineBricking({
  bootstrap: './src/bootstrap.ts',
  plugins: [
    require('rollup-plugin-svelte')({
      preprocess: require('svelte-preprocess')()
    }),
  ]
})
