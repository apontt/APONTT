#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

PORT = 8000
DEFAULT_HTML_FILE = 'deepseek_html_20250909_2bf8a5.html'

# Usar diretório atual em vez de caminho hardcoded
DIRECTORY = os.getcwd()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def do_GET(self):
        # Redirecionar raiz para o arquivo HTML principal
        if self.path == '/':
            self.path = '/' + DEFAULT_HTML_FILE
        super().do_GET()

def main():
    try:
        # Verificar se o arquivo HTML existe
        html_file_path = Path(DIRECTORY) / DEFAULT_HTML_FILE
        if not html_file_path.exists():
            print(f"Erro: Arquivo {DEFAULT_HTML_FILE} não encontrado no diretório atual.")
            print(f"Diretório atual: {DIRECTORY}")
            sys.exit(1)
        
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Servidor rodando em: http://localhost:{PORT}")
            print(f"Acesse o sistema em: http://localhost:{PORT}/{DEFAULT_HTML_FILE}")
            print("Pressione Ctrl+C para parar o servidor")
            
            # Tentar abrir automaticamente no navegador
            try:
                webbrowser.open(f"http://localhost:{PORT}/{DEFAULT_HTML_FILE}")
            except Exception as e:
                print(f"Não foi possível abrir o navegador automaticamente: {e}")
                print(f"Acesse manualmente: http://localhost:{PORT}/{DEFAULT_HTML_FILE}")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServidor parado.")
                
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"Erro: Porta {PORT} já está em uso.")
            print("Tente usar uma porta diferente ou pare o processo que está usando esta porta.")
        else:
            print(f"Erro ao iniciar servidor: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Erro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()