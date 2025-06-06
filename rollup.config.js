import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import inlineWorkers from './rollup-plugin-inline-workers.js';

export default [
  // Bundled build with inlined workers (for CDN usage)
  {
    input: 'src/index.ts',
    output: {
      name: 'WhisperTranscriber',
      file: 'dist/index.bundled.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      inlineWorkers(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // Minified bundled build with inlined workers
  {
    input: 'src/index.ts',
    output: {
      name: 'WhisperTranscriber',
      file: 'dist/index.bundled.min.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      inlineWorkers(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ]
  },
  // UMD build
  {
    input: 'src/index.ts',
    output: {
      name: 'WhisperTranscriber',
      file: 'dist/index.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      copy({
        targets: [
          { src: 'libstream.js', dest: 'dist' },
          { src: 'libstream.worker.js', dest: 'dist' },
          { src: 'helpers.js', dest: 'dist' },
          { src: 'coi-serviceworker.js', dest: 'dist' }
        ]
      })
    ]
  },
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      name: 'WhisperTranscriber',
      file: 'dist/index.min.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ]
  }
];