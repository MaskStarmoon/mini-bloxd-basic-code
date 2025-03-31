const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

let players = {};

wss.on("connection", (ws) => {
    console.log("Pemain terhubung!");

    let playerId = null;

    ws.on("message", (message) => {
        let data = JSON.parse(message);

        if (data.type === "join") {
            playerId = data.id;
            players[playerId] = {
                name: data.name,
                x: data.x,
                y: data.y,
                z: data.z
            };
        }

        if (data.type === "move") {
            if (players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
                players[data.id].z = data.z;
            }
        }

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "update", players }));
            }
        });
    });

    ws.on("close", () => {
        if (playerId) {
            delete players[playerId];

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "update", players }));
                }
            });
        }
        console.log("Pemain terputus:", playerId);
    });
});

server.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
