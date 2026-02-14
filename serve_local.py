"""
Serveur HTTP local pour tester mandats.html
"""
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Ajouter les headers CORS pour éviter les problèmes
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

# Changer vers le répertoire du script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print("="*70)
    print(f"🚀 Serveur HTTP démarré sur le port {PORT}")
    print(f"📄 Ouvrez dans votre navigateur:")
    print(f"   http://localhost:{PORT}/mandats.html")
    print()
    print("💡 Ce serveur permet de tester mandats.html sans problèmes CORS")
    print("⏹️  Appuyez sur Ctrl+C pour arrêter")
    print("="*70)
    httpd.serve_forever()
