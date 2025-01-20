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
            console.log("收到消息:", msgString);
    
            // Unity 客戶端連接
            if (msgString === "Unity") {
                console.log("Unity 客戶端已認證");
                unitySocket = ws; // 保存 Unity 連接
                broadcastToClients("InteractiveConnected"); // 廣播 Unity 已連接
                console.log("Unity 客戶端已成功連接");
            }
            // 處理接收到的文本數據並轉發給 Unity，只處理正確的文本格式
            else if (/^Nickname: .+, Message: .+$/.test(msgString)) {
                // 提取 nickname 和 message
                const regex = /^Nickname:\s*(.*),\s*Message:\s*(.*)$/;
                const match = msgString.match(regex);
    
                if (match) {
                    const nickname = match[1]; // 提取的 nickname
                    let messageText = match[2]; // 提取的 message
    
                    // 處理 messageText，根據字符長度插入換行符
                    const maxLengths = [4, 5, 3]; // 期望的長度限制
                    let formattedMessage = '';
                    let currentLine = '';
                    let currentLength = 0;  // 追蹤當前行的長度
    
                    for (let i = 0; i < messageText.length; i++) {
                        const char = messageText[i];
                        const charLength = /[\u0020-\u007E]/.test(char) ? 0.5 : 1;  // ASCII 佔 0.5，其他佔 1
    
                        currentLength += charLength;
                        currentLine += char;
    
                        // 檢查是否需要換行
                        if (currentLength >= maxLengths[0]) {
                            formattedMessage += currentLine + '\n'; // 添加換行符
                            currentLine = '';
                            currentLength = 0;  // 重置長度計數器
                            maxLengths.shift();  // 刪除已經處理的長度限制
                        }
                    }
    
                    // 加上剩下的字符（如果有）
                    if (currentLine.length > 0) {
                        formattedMessage += currentLine;
                    }
    
                    // 格式化要發送的文本
                    const finalMessage = `Nickname: ${nickname}, Message: ${formattedMessage}`;
    
                    // 如果 Unity 客戶端已連接且連接狀態是開啟的
                    if (unitySocket && unitySocket.readyState === WebSocket.OPEN) {
                        unitySocket.send(finalMessage); // 直接將格式化後的文本數據發送到 Unity
                        console.log("數據已發送到 Unity:", finalMessage);
                    } else {
                        ws.send("Unity 未連接，無法轉發數據");
                        console.log("Unity 未連接，無法轉發數據");
                    }
                } else {
                    console.log("消息解析失敗，格式不正確");
                }
            } else {
                console.log("收到的消息格式不符合要求");
            }
    
        } catch (error) {
            console.error("處理消息時發生錯誤:", error);
            ws.send("處理消息錯誤"); // 發送錯誤訊息給客戶端
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
