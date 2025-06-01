Create a simple html file with text input file, where audio will be transcribed in real-time using the whisper.cpp library ( webassembly )

Follow the steps, to build the whisper.cpp library for webassembly
and then use it in the html file
Implement to solution end to end


----

stream.wasm
Real-time transcription in the browser using WebAssembly

Online demo: https://whisper.ggerganov.com/stream/

Build instructions
# build using Emscripten (v3.1.2)
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
mkdir build-em && cd build-em
emcmake cmake ..
make -j
The example can then be started by running a local HTTP server:

python3 examples/server.py
And then opening a browser to the following URL: http://localhost:8000/stream.wasm

To run the example in a different server, you need to copy the following files to the server's HTTP path:

# copy the produced page to your HTTP path
cp bin/stream.wasm/*       /path/to/html/
cp bin/libstream.js        /path/to/html/
cp bin/libstream.worker.js /path/to/html/
📝 Note: As of Emscripten 3.1.58 (April 2024), separate worker.js files are no longer generated and the worker is embedded in the main JS file. So the worker file will not be geneated for versions later than 3.1.58.
