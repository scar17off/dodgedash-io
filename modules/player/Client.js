const Player = require("./Player");

/**
 * Represents a client.
 * @class
 */
class Client {
  /**
   * Creates a new client instance.
   * @constructor
   * @param {Object} ws - The WebSocket connection.
   * @param {Object} req - The request object.
   */
  constructor(ws, req) {
    /**
     * @property {Object} ws - The WebSocket connection.
     */
    this.ws = ws;
    /**
     * @property {Object} req - The request object.
     */
    this.req = req;
    /**
     * @property {Player} player - The player instance.
     */
    this.player = new Player(this.ws);
    /**
     * @property {string} ip - The client's IP address.
     */
    this.ip = req.connection.remoteAddress;
  }

  /**
   * Sends an event with data to the client.
   * @param {string} event - The event name.
   * @param {Object} data - The data to send.
   */
  send(event, data) {
    this.ws.emit(event, data);
  }
}

module.exports = Client;