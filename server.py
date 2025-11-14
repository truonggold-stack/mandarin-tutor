#!/usr/bin/env python3
"""
Simple HTTP server for testing Mandarin Tutor locally.
This allows ES6 modules to load properly without CORS errors.

Usage:
    python3 server.py

Then open: http://localhost:8000
"""

import http.server
import socketserver
import os

PORT = 8000

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🚀 Mandarin Tutor server running at http://localhost:{PORT}")
    print(f"📂 Serving from: {os.getcwd()}")
    print("\nPress Ctrl+C to stop the server")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
