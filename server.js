const http = require('http');
const WebSocket = require('ws');
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let unitySocket = null;

wss.on("connection", (ws) => {
    console.log("新客戶端已連接");

    // 心跳檢查機制
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping(); // 發送心跳信號
        }
    }, 25000); // 每 25 秒發送一次心跳

    // 當新的網頁客戶端連接時，發送 Unity 的當前連接狀態
    if (unitySocket && unitySocket.readyState === WebSocket.OPEN) {
        ws.send("InteractiveConnected");
    }

    ws.on("message", (message) => {
        try {
            const msgString = message.toString();

            // 獲取短消息（處理長度小於 20 的情況）
            const shortMsgString = msgString.length > 20 ? msgString.substring(0, 20) : msgString;
            console.log("收到消息:", shortMsgString);

            // Unity 客戶端連接
            if (message === "Unity") {
                console.log("Unity 客戶端已認證");
                unitySocket = ws; // 保存 Unity 連接
                broadcastToClients("InteractiveConnected"); // 廣播 Unity 已連接
            }
            // 處理接收到的文本數據並轉發給 Unity
            else {
                if (unitySocket && unitySocket.readyState === WebSocket.OPEN) {
                    unitySocket.send(message.toString()); // 直接將文本數據發送到 Unity
                    console.log("數據已發送到 Unity");
                } else {
                    ws.send("Unity 未連接，無法轉發數據");
                    console.log("Unity 未連接，無法轉發數據");
                }
            }

        } catch (error) {
            console.error("處理消息時發生錯誤:", error);
            ws.send(JSON.stringify({ status: "error", message: "無法處理消息" }));
        }
    });

    // 客戶端斷開處理
    ws.on("close", () => {
        clearInterval(interval); // 清除心跳定時器

        if (ws === unitySocket) {
            console.log("Unity 客戶端已斷開");
            unitySocket = null;
            broadcastToClients("UnityDisconnected"); // 廣播 Unity 已斷開狀態
        } else {
            console.log("普通客戶端已斷開");
        }
    });

    // 錯誤處理
    ws.on("error", (err) => {
        console.error("WebSocket 錯誤:", err);
    });
});

// 廣播消息給所有客戶端
function broadcastToClients(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 啟動伺服器
server.listen(PORT, () => {
    console.log(`靜態網頁可訪問：http://localhost:${PORT}`);
});
