import fs from 'fs';
import path from 'path';

export default function inlineWorkers() {
  return {
    name: 'inline-workers',
    transform(code, id) {
      if (id.endsWith('src/index.ts')) {
        // Read worker files
        const workerCode = fs.readFileSync(path.resolve('./libstream.worker.js'), 'utf8');
        const helpersCode = fs.readFileSync(path.resolve('./helpers.js'), 'utf8');
        const libstreamCode = fs.readFileSync(path.resolve('./libstream.js'), 'utf8');
        const coiServiceWorkerCode = fs.readFileSync(path.resolve('./coi-serviceworker.js'), 'utf8');
        
        // Create the injection code
        const injection = `
// Inlined worker and helper files
window.LIBSTREAM_WORKER_CODE = ${JSON.stringify(workerCode)};
window.HELPERS_CODE = ${JSON.stringify(helpersCode)};
window.LIBSTREAM_CODE = ${JSON.stringify(libstreamCode)};
window.COI_SERVICEWORKER_CODE = ${JSON.stringify(coiServiceWorkerCode)};

`;
        
        // Prepend the injection to the original code
        return {
          code: injection + code,
          map: null
        };
      }
    }
  };
}