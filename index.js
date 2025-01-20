const { app, BrowserWindow } = require('electron')
const WebSocket = require('ws');

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600
    })
  
    win.loadFile('index.html')
  }

const startWebSocketServer = () => {
  const wss = new WebSocket.Server({ port: 8080 });

  console.log('Servidor Websocket iniciado na porta ws://localhost:8080');

  wss.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('message', (message) => {
      console.log(`Recebido: ${message}`);

      // Broadcast para todos os clientes conectados
      wss.clients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });

    socket.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

  app.whenReady().then(() => {
    createWindow()
    startWebSocketServer()
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })

  })

    