import { io } from "socket.io-client";

const socket = io("http://localhost:443");

export default socket;