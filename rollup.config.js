import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
  },
  external: ['@kintone/rest-api-client'],
  plugins: [
    typescript(),
    nodeResolve(),
  ],
};
