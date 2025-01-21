const ws = new WebSocket("ws://localhost:8080");

const messagesBox = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendMessage");
const errorMessage = document.getElementById("errorMessage");
const connectionStatus = document.getElementById("connectionStatus");

const scrollToBottom = () => {
  messagesBox.scrollTop = messagesBox.scrollHeight;
};

ws.onerror = (error) => {
  errorMessage.style.display = "block";
  errorMessage.textContent =
    "Erro no WebSocket: Não foi possível conectar ao servidor.";
};

ws.onopen = function open() {
  errorMessage.style.display = "none";
  connectionStatus.style.display = "flex";
};

ws.onmessage = function message(event) {
  const response = JSON.parse(event.data);
  if (response.type === "history") {
    response.data.forEach((msg) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message");
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="sender">${msg.sender}</span>
          <span class="timestamp">${msg.timestamp}</span>
        </div>
        <div class="message-text">${msg.message}</div>
      `;
      messagesBox.appendChild(messageElement);
    });
    scrollToBottom();
  }
  if (response.type === "message") {
    const { sender, message, timestamp } = response.data;
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="sender">${sender}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-text">${message}</div>
    `;
    messagesBox.appendChild(messageElement);
    scrollToBottom();
  }
};

sendButton.addEventListener("click", () => {
  const message = messageInput.value;
  if (!message) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "Você precisa digitar algo para enviar.";
    return;
  }
  errorMessage.style.display = "none";
  ws.send(JSON.stringify({ type: "message", sender: "Electron", message }));
  messageInput.value = "";
});
