const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const HOSTNAME = 'localhost';
const DEFAULT_HTML_FILE = 'deepseek_html_20250909_2bf8a5.html';

// Mover mimeTypes para fora do handler para melhor performance
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Função para validar e sanitizar o caminho do arquivo
function sanitizePath(requestPath) {
    // Normalizar o caminho
    let filePath = path.normalize('.' + requestPath);
    
    // Verificar se é o diretório raiz
    if (filePath === './' || filePath === '.') {
        filePath = './' + DEFAULT_HTML_FILE;
    }
    
    // Verificar se o caminho está dentro do diretório atual (prevenir path traversal)
    const resolvedPath = path.resolve(filePath);
    const currentDir = path.resolve('.');
    
    if (!resolvedPath.startsWith(currentDir)) {
        return null; // Caminho inválido
    }
    
    return filePath;
}

const server = http.createServer((req, res) => {
    const filePath = sanitizePath(req.url);
    
    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Acesso negado</h1>', 'utf-8');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo não encontrado</h1>', 'utf-8');
            } else {
                console.error('Erro interno do servidor:', error);
                res.writeHead(500);
                res.end('Erro interno do servidor\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOSTNAME, () => {
    console.log(`Servidor rodando em: http://${HOSTNAME}:${PORT}`);
    console.log(`Acesse o sistema em: http://${HOSTNAME}:${PORT}/${DEFAULT_HTML_FILE}`);
    console.log('Pressione Ctrl+C para parar o servidor');
    
    // Abre automaticamente no navegador com tratamento de erro
    exec(`start http://${HOSTNAME}:${PORT}/${DEFAULT_HTML_FILE}`, (error) => {
        if (error) {
            console.log('Não foi possível abrir o navegador automaticamente.');
            console.log('Acesse manualmente:', `http://${HOSTNAME}:${PORT}/${DEFAULT_HTML_FILE}`);
        }
    });
});

// Tratamento gracioso de encerramento
process.on('SIGINT', () => {
    console.log('\nEncerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        process.exit(0);
    });
});