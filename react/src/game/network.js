import { io } from "socket.io-client";
import protocol from "../protocol.json";

const socket = io(protocol.wsUrl);

export default socket;