#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os

PORT = 8000
DIRECTORY = r"C:\Users\lucal\Downloads"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor rodando em: http://localhost:{PORT}")
        print(f"Acesse o sistema em: http://localhost:{PORT}/deepseek_html_20250908_2bf8a5.html")
        print("Pressione Ctrl+C para parar o servidor")
        
        # Abre automaticamente no navegador
        webbrowser.open(f"http://localhost:{PORT}/deepseek_html_20250908_2bf8a5.html")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor parado.")