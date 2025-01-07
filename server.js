const http = require('http');
const WebSocket = require('ws');

// 創建 HTTP 伺服器
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('WebSocket server is running.');
});

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('客戶端已連接');
    ws.on('message', message => {
        console.log('收到訊息:', message);
        ws.send(`伺服器回應: ${message}`);
    });

    ws.on('close', () => {
        console.log('客戶端已斷開');
    });
});

// 啟動伺服器
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
});
