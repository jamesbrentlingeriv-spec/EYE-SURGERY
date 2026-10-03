import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
  input: '.build-ts/main.js',
  output: {
    file: 'dist/assets/index.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    resolve({
      browser: true,
      extensions: ['.js', '.jsx', '.json'],
    }),
    commonjs(),
  ],
};
