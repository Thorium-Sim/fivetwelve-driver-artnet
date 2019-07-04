const DEFAULT_OPTIONS = {
  universeMapping: { 1: 1, 2: 2 }
};
const dgram = require("dgram");

const HEADER = Buffer.from([65, 114, 116, 45, 78, 101, 116, 0, 0, 80, 0, 14]);
const SEQUENCE = Buffer.from([0]);
const PHYSICAL = Buffer.from([0]);
const LENGTH = Buffer.from([0x02, 0x00]);

class ArtNetDriver {
  /**
   * Initializes the driver for the given serialport.
   * @param {ipAddress} The artnet IP Address.
   * @param {object} options
   * @param {object} options.universeMapping A mapping of fivetwelve
   *     universe-numbers to usbpro universes 1/2.
   */
  constructor(ipAddress = "127.0.0.1", options = {}) {
    /**
     * @type {object}
     */
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.universeId = Buffer.from([0x00, 0x00]);

    this.universeId.writeInt16LE(options.universe || 0, 0);

    this.host = ipAddress;
    this.port = options.port || 6454;
    this.dev = dgram.createSocket("udp4");
    this.dev.bind(() => this.dev.setBroadcast(true));
    console.log(this);
  }

  /**
   * Sends the given values to the dmx-interface over the serialport.
   * @param {Buffer} buffer A buffer with the dmx-values to be sent.
   * @param {Number} universe The 1-based universe-number.
   * @returns {Promise} A promise that will be resolved when the buffer is
   *   completely sent.
   */
  send(buffer) {
    // for whatever-reason, dmx-transmission has to start with a zero-byte.
    const frameBuffer = new Buffer(513);
    frameBuffer.writeUInt8(0, 0);
    buffer.copy(frameBuffer, 1);

    return this.sendPacket(frameBuffer);
  }

  /**
   * Sends a single packet to the usbpro.
   * @param {Buffer} data The message payload.
   * @returns {Promise} A promise indicating when the data has been sent.
   * @private
   */
  sendPacket(data) {
    const pkg = Buffer.concat([
      HEADER,
      SEQUENCE,
      PHYSICAL,
      this.universeId,
      LENGTH,
      data.slice(1)
    ]);
    return new Promise((resolve, reject) =>
      this.dev.send(pkg, 0, pkg.length, this.port, this.host, (err, res) => {
        if (err) return reject(err);
        return resolve("Resolve!");
      })
    );
  }
}

module.exports = ArtNetDriver;
