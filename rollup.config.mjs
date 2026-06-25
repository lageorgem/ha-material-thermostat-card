import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/material-thermostat-card.ts',
  output: {
    file: 'dist/material-thermostat-card.js',
    format: 'es',
    sourcemap: dev,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.json' }),
    !dev &&
      terser({
        format: { comments: false },
        compress: { passes: 2 },
        mangle: { properties: false },
      }),
  ].filter(Boolean),
  // Lit logs a benign "this is undefined" warning during bundling; silence only that.
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};
