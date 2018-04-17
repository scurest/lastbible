const upng = require('upng-js');

exports.Image = class {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(4*width*height);
    this.palette = [[224,248,208], [136,192,112], [52,104,86], [8,24,32]];
  }

  drawTile(tileBuf, x, y) {
    let idx = 0;
    for (let dy = 0; dy !== 8; dy++) {
      const b0 = tileBuf[idx++];
      const b1 = tileBuf[idx++];
      for (let dx = 0; dx !== 8; dx++) {
        const mask = 0x80 >>> dx;
        const color = this.palette[!!(b0 & mask) | (!!(b1 & mask) << 1)];
        const pos = 4 * (this.width*(y+dy) + (x+dx));
        this.data[pos+0] = color[0];
        this.data[pos+1] = color[1];
        this.data[pos+2] = color[2];
        this.data[pos+3] = 255;
      }
    }
  }

  toPng() {
    return upng.encode([this.data.buffer], this.width, this.height, 0);
  }
}
