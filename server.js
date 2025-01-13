const http = require('http');
const WebSocket = require('ws');
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 處理 WebSocket 連接
wss.on('connection', ws => {
    console.log('客戶端已連接');

    // 接收訊息
    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            console.log('收到的 JSON 資料:', data);

            // 傳遞給 Unity (此處可根據需要轉發)
            ws.send(JSON.stringify({ status: 'received', data }));

        } catch (error) {
            console.error('無法解析訊息:', message);
            ws.send(JSON.stringify({ status: 'error', message: '無法解析 JSON' }));
        }
    });

    ws.on('close', () => {
        console.log('客戶端已斷開');
    });
});

server.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
});
