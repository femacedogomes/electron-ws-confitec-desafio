const { app, BrowserWindow } = require("electron");
const { WebSocketServer } = require("ws");
const WebSocket = require("ws");
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "chat.db"));

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )
`
).run();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  const wss = new WebSocketServer({ port: 8080, clientTracking: true });

  wss.on("connection", (ws) => {
    console.log("Cliente conectado.");
    const messages = db.prepare("SELECT * FROM messages").all() || [];
    ws.send(JSON.stringify({ type: "history", data: messages }));

    ws.on("message", (data) => {
      const parsedData = JSON.parse(data);

      if (parsedData.type === "message") {
        const { sender, message } = parsedData;

        const result = db
          .prepare("INSERT INTO messages (sender, message) VALUES (?, ?)")
          .run(sender, message);

        const insertedMessage = db
          .prepare(
            "SELECT id, sender, message, timestamp FROM messages WHERE id = ?"
          )
          .get(result.lastInsertRowid);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ type: "message", data: insertedMessage })
            );
          }
        });
      }
    });

    ws.on("close", () => {
      console.log("Cliente desconectado.");
    });
  });

  console.log("Servidor WebSocket rodando na porta 8080.");
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
