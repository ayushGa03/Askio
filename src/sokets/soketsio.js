import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenve from "dotenv"
dotenve.config();

let io;

export function connectToSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.VITE_BASE_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Authenticate the socket using the token sent from the client
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
        // Join a private room named by userId so events are user-scoped
        socket.join(`user_${decoded.userId}`);
        socket.data.userId = decoded.userId;
        console.log(`✓ Socket ${socket.id} joined room user_${decoded.userId}`);
      } catch (_) {
        console.log(`✗ Socket ${socket.id} — invalid token, not joining user room`);
      }
    }

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.io initialised");
  return io;
}

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};