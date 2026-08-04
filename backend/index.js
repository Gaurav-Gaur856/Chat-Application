const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const {
  connectToDatabase,
  getAllMessages,
  saveMessage,
} = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const saveAndBroadcastMessage = async (messageData) => {
  const message = await saveMessage(messageData);
  io.emit("received-message", message);
  return message;
};

app.get("/messages", async (req, res) => {
  try {
    const messages = await getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to fetch messages" });
  }
});

app.post("/messages", async (req, res) => {
  const { message, user, time } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
    const savedMessage = await saveAndBroadcastMessage({ message, user, time });
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save message" });
  }
});

io.on("connection", async (socket) => {
  console.log(`User connected : ${socket.id}`);

  try {
    const messages = await getAllMessages();
    socket.emit("chat-history", messages);
  } catch (error) {
    console.error(error);
  }

  socket.on("send-message", async (message) => {
    if (!message?.message?.trim()) {
      return;
    }

    await saveAndBroadcastMessage(message);
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

const startServer = async () => {
  await connectToDatabase();
  server.listen(5000, () => console.log("Server running at PORT 5000"));
};

startServer();
