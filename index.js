const { app, BrowserWindow } = require("electron");
const { WebSocketServer } = require("ws");
const WebSocket = require("ws");
const Database = require("better-sqlite3");
const path = require("path");

// Inicializa o banco de dados SQLite
const db = new Database(path.join(__dirname, "chat.db"));

// Cria a tabela de mensagens, se não existir
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
    webPreferences: {
      nodeIntegration: true, // Certifique-se de ativar isso se necessário
    },
  });

  win.loadFile("index.html");
  // Abre as ferramentas de desenvolvedor
  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  // Inicializa o servidor WebSocket
  const wss = new WebSocketServer({ port: 8080, clientTracking: true });

  wss.on("connection", (ws) => {
    console.log("Cliente conectado.");
    // Envia mensagens antigas ao cliente recém-conectado
    const messages = db.prepare("SELECT * FROM messages").all() || [];
    ws.send(JSON.stringify({ type: "history", data: messages }));

    ws.on("message", (data) => {
      const parsedData = JSON.parse(data);
      // Verifica se o tipo da mensagem é "history" e possui um array de mensagens
      if (parsedData.type === "history") {
        parsedData.messages.forEach((msg) => {
          console.log(msg);
        });
      }

      // Lida com mensagens do tipo "message"
      if (parsedData.type === "message") {
        const { sender, message } = parsedData;

        // Insere a mensagem no banco de dados
        db.prepare("INSERT INTO messages (sender, message) VALUES (?, ?)").run(
          sender,
          message
        );
        // Reenvia a mensagem para todos os clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ type: "message", data: { sender, message } })
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
