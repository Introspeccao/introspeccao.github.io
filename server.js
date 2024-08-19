const http = require('http');
const fs   = require('fs');
const path = require('path');

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.svg': 'image/svg+xml',
    '.css': 'text/css',
    '.js': 'text/javascript',
};

function getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    return mimeTypes[extension] || 'application/octet-stream'; // Default to octet-stream
}

const hostname = '127.0.0.1';
const port     = 3000;

const server = http.createServer((req, res) => {
    const url      = req.url === '/' ? 'index.html' : req.url;
    const filePath = __dirname + `/${url}`;

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('404 Not Found');
        } else {
            const mime = getMimeType(filePath);
            res.writeHead(200, {'Content-Type': mime});
            res.end(data);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});