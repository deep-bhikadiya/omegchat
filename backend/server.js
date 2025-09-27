const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let waitingUser = null; // single user waiting
const users = new Map(); // socket.id -> partnerId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  io.emit("update-user-count", io.sockets.sockets.size);

  // Find stranger
  socket.on("find", () => {
    if (waitingUser && waitingUser !== socket.id) {
      const partnerId = waitingUser;
      waitingUser = null;
      console.log(waitingUser);
      socket.emit("partner-found", { partnerId, initiator: true });
      io.to(partnerId).emit("partner-found", { partnerId: socket.id, initiator: false });

      users.set(socket.id, partnerId);
      users.set(partnerId, socket.id);
    } else {
      waitingUser = socket.id;
      socket.emit("no-user-online");
    }
  });

  // Stop finding
  socket.on("stop-find", () => {
    if (waitingUser === socket.id) waitingUser = null;
  });

  // Next button
  socket.on("next", () => {
    const partnerId = users.get(socket.id);
    if (partnerId) io.to(partnerId).emit("partner-left");
    users.delete(partnerId);
    users.delete(socket.id);

    if (waitingUser === socket.id) waitingUser = null;
  });

  // WebRTC signaling
  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  // Chat message
  socket.on("chat-message", ({ to, message }) => {
    io.to(to).emit("chat-message", { from: socket.id, message });
  });

  socket.on("disconnect", () => {
    const partnerId = users.get(socket.id);
    if (partnerId) io.to(partnerId).emit("partner-left");
    users.delete(partnerId);
    if (waitingUser === socket.id) waitingUser = null;
    users.delete(socket.id);

    io.emit("update-user-count", io.sockets.sockets.size);
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => console.log("Server running on port 3001"));
