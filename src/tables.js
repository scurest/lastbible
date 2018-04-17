exports.gatherTables = function(rom) {
  return {
    'monsters': gatherMonsters(rom),
    'items': gatherItems(rom),
    'effects': gatherEffects(rom),
  };
};

function nibbles(x) {
  return [x & 0xf, (x >>> 4) & 0xf];
}

const monsTableOffs = {
  'gb-jp': 0x14f0a,
  'gbc-jp': 0x166dc,
  'gbc-en': 0x166dc,
};
const numMons = 109;
const monsTableEntrySize = 32;

const monGfxTableOffs = {
  'gbc-en': 0x44000,
};
const gfxTableEntrySize = 6;

function gatherMonsters(rom) {
  const tableOff = monsTableOffs[rom.version];
  const tableSize = numMons * monsTableEntrySize;
  const buf = rom.read(tableOff, tableSize);

  const gfxTableOff = monGfxTableOffs[rom.version];
  const gfxTableSize = numMons * gfxTableEntrySize;
  const gfxBuf = rom.read(gfxTableOff, gfxTableSize);

  const table = [];
  for (let i = 0; i !== numMons; i++) {
    const pos = i * monsTableEntrySize;

    const num = i + 1;

    const name = rom.decodeText(buf.slice(pos, pos+7));
    const lvl = buf.readUInt8(pos+7);
    const hp = buf.readUInt16LE(pos+8);
    const mp = buf.readUInt8(pos+10);
    const tribe = buf.readUInt8(pos+11);

    const stat = (x) => 5 + 2*x;
    const [end, int] = nibbles(buf.readUInt8(pos+12));
    const endurance = stat(end);
    const intelligence = stat(int);
    const [str, spd] = nibbles(buf.readUInt8(pos+13));
    const strength = stat(str);
    const speed = stat(spd);
    const [luk, _] = nibbles(buf.readUInt8(pos+14));
    const luck = stat(luk);

    //const unknown = buf.readUInt8(pos+15);
    //const unknown = buf.readUInt8(pos+16);

    const [allySpellCount, enemySpellCount] = nibbles(buf.readUInt8(pos+17));

    const spells = [];
    for (let j = 0; j != 4; j++) {
      const spell = buf.readUInt8(pos+18+j);
      if (spell == 0xff) break;
      spells.push(spell);
    }

    const gfxPos = 6 * i;
    const [tilesWidth, tilesHeight] = nibbles(gfxBuf.readUInt8(gfxPos));
    const romBank = gfxBuf.readUInt8(gfxPos+1);
    const addr = gfxBuf.readUInt16LE(gfxPos+2);
    // Next two bytes are probably palette data.

    const romOffset = (addr - 0x4000) + romBank * 0x4000;

    const sprite = { tilesWidth, tilesHeight, romOffset };

    table[i] = {
      num, name, lvl, hp, mp, tribe,
      endurance, intelligence, strength, speed, luck,
      enemySpellCount, allySpellCount, spells,
      sprite,
    };
  }
  return table;
};


const effectTableOffs = {
  'gb-jp': 0x40000,
  'gbc-jp': 0x40000,
  'gbc-en': 0x40000,
};

const numEffects = 90;
const effectTableEntrySize = 14;

function gatherEffects(rom) {
  const tableOff = effectTableOffs[rom.version];
  const tableSize = numEffects * effectTableEntrySize;
  const buf = rom.read(tableOff, tableSize);

  const table = [];
  for (let i = 0; i !== numEffects; i++) {
    const pos = i * effectTableEntrySize;

    const num = i + 1;
    const name = rom.decodeText(buf.slice(pos, pos+12));
    const _unknown = buf.readUInt8(pos+12);
    const cost = buf.readUInt8(pos+13);

    table[i] = {
      num, name, _unknown, cost,
    };
  }
  return table;
}


const itemTableOffs = {
  'gb-jp': 0x405c4,
  'gbc-jp': 0x405c4,
  'gbc-en': 0x405c4,
};

const numItems = 105;
const itemTableEntrySize = 23;

function gatherItems(rom) {
  const tableOff = itemTableOffs[rom.version];
  const tableSize = numItems * itemTableEntrySize;
  const buf = rom.read(tableOff, tableSize);

  const table = [];
  for (let i = 0; i !== numItems; i++) {
    const pos = i * itemTableEntrySize;

    const num = i + 1;
    const name = rom.decodeText(buf.slice(pos, pos+12));
    //const unknown = buf.readUInt8(pos+12);
    let sellPrice = buf.readUInt16LE(pos+13);
    let buyPrice = sellPrice + (sellPrice >>> 1); // mask this to 16 bits?

    table[i] = {
      num, name, sellPrice, buyPrice,
    };
  }
  return table;
}
