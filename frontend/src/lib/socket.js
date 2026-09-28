import { io } from "socket.io-client";
import { SOCKET_URL } from "../config.js";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 6,
      timeout: 5000,
    });
  }
  return socket;
}
