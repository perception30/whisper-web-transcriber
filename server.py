#!/usr/bin/env python3
"""
Simple HTTP server with proper headers for WebAssembly and SharedArrayBuffer support
"""

import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers required for SharedArrayBuffer and WebAssembly
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        # Allow eval for Emscripten
        self.send_header('Content-Security-Policy', "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:;")
        super().end_headers()
    
    def do_GET(self):
        # Serve files with correct MIME types
        if self.path.endswith('.wasm'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/wasm')
            self.end_headers()
            with open(self.path[1:], 'rb') as f:
                self.wfile.write(f.read())
        else:
            super().do_GET()

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()