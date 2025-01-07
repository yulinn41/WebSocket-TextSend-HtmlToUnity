const http = require('http');
const WebSocket = require('ws');


const express = require("express");
const path = require("path");

// 使用 Render 或 Heroku 指定的 PORT 或預設為 8080
const PORT = process.env.PORT || 8080;

// 創建 Express 應用
const app = express();

// 提供靜態檔案 (將 public 資料夾設為根目錄)
app.use(express.static(path.join(__dirname, "public")));

// 創建 HTTP 伺服器，並將 Express 設置為 handler
const server = http.createServer(app);

// 在 HTTP 伺服器上創建 WebSocket 伺服器
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
server.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
});
