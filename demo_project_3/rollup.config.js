import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    // Replace environment variables
    replace({
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      preventAssignment: true
    }),
    
    // Resolve node modules
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    
    // Convert CommonJS modules to ES6
    commonjs(),
    
    // Copy static files
    copy({
      targets: [
        { src: 'src/index.html', dest: 'dist' },
        { src: 'src/style.css', dest: 'dist' },
        // Copy all required files from whisper-web-transcriber
        { 
          src: 'node_modules/whisper-web-transcriber/dist/*', 
          dest: 'dist' 
        }
      ]
    }),
    
    // Development server
    !production && serve({
      open: true,
      contentBase: 'dist',
      host: '0.0.0.0',
      port: 3000,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    })
  ],
  watch: {
    clearScreen: false
  }
};