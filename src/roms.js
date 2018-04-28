const fs = require('fs');
const text = require('./text.js');


const versions = {
  'gb-jp': {
    cartTitle: 'LAST BIBLE\0\0\0\0\0\0',
    name: '女神転生外伝　Ｌａｓｔ　Ｂｉｂｌｅ (Game Boy, 1992)',
    lang: 'jp',
  },
  'gbc-jp': {
    cartTitle: 'LAST BIBLE1\0\0\0\0\x80',
    name: '女神転生外伝　Ｌａｓｔ　Ｂｉｂｌｅ (Game Boy Color, 1999)',
    lang: 'jp',
  },
  'gbc-en': {
    cartTitle: 'REVELATIONSALBE\x80',
    name: 'Revelations: The Demon Slayer (Game Boy Color, 1999)',
    lang: 'en',
  }
};
exports.versions = versions;


function detectVersion(cartTitle) {
  for (const version of Object.keys(versions)) {
    if (cartTitle.equals(Buffer.from(versions[version].cartTitle, 'ascii'))) {
      return version;
    }
  }
  throw `unknown Last Bible ROM (cart title was ${JSON.stringify(cartTitle.toString('ascii'))})`;
}


exports.Rom = class {
  constructor(path) {
    this.path = path;
    this.fd = fs.openSync(path, 'r');

    // Read the title from the cartridge header and use it to detect which ROM
    // version we got.
    const cartTitle = this.read(0x134, 16);
    this.version = detectVersion(cartTitle);

    this.decodeText = text.decoders[versions[this.version].lang];
  }

  read(pos, len) {
    const buf = Buffer.alloc(len);
    if (fs.readSync(this.fd, buf, 0, len, pos) !== len) {
      throw `couldn't read from ROM (pos=${pos}, len=${len})`;
    }
    return buf;
  }
};
