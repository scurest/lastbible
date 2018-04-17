exports.gatherTables = function(rom) {
  return {
    'monsters': gatherMonsters(rom),
    'monsterSprites': gatherMonsterSprites(rom),
    'items': gatherItems(rom),
    'effects': gatherEffects(rom),
  };
};


const monTableDefs = {
  'gb-jp': {
    offset: 0x14f0a,
    elemSize: 32,
    numElems: 109,
  },
  'gbc-jp': {
    offset: 0x166dc,
    elemSize: 32,
    numElems: 109,
  },
  'gbc-en': {
    offset: 0x166dc,
    elemSize: 32,
    numElems: 109,
  },
};

function gatherMonsters(rom) {
  const def = monTableDefs[rom.version];
  if (!def) return undefined;

  const monTable = readArray(rom, def);
  return monTable.map((buf, i) => {
    const num = i + 1;

    const name = rom.decodeText(buf.slice(0,7));
    const lvl = buf.readUInt8(7);
    const hp = buf.readUInt16LE(8);
    const mp = buf.readUInt8(10);
    const tribe = buf.readUInt8(11);

    const stat = (x) => 5 + 2*x;
    const [end, int] = nibbles(buf.readUInt8(12));
    const endurance = stat(end);
    const intelligence = stat(int);
    const [str, spd] = nibbles(buf.readUInt8(13));
    const strength = stat(str);
    const speed = stat(spd);
    const [luk, _] = nibbles(buf.readUInt8(14));
    const luck = stat(luk);

    //const unknown = buf.readUInt8(pos+15);
    //const unknown = buf.readUInt8(pos+16);

    const [allySpellCount, enemySpellCount] = nibbles(buf.readUInt8(17));

    const spells = Array.from(buf.slice(18,22));
    while (spells[spells.length-1] === 0xff) spells.pop();

    return {
      num, name, lvl, hp, mp, tribe,
      endurance, intelligence, strength, speed, luck,
      enemySpellCount, allySpellCount, spells,
    };
  });
};


const monSpriteTableDefs = {
  'gb-jp': {
    offset: 0x14d45,
    elemSize: 4,
    numElems: 113,
  },
  'gbc-jp': {
    offset: 0x44000,
    elemSize: 6,
    numElems: 113,
  },
  'gbc-en': {
    offset: 0x44000,
    elemSize: 6,
    numElems: 113,
  },
};

function gatherMonsterSprites(rom) {
  const def = monSpriteTableDefs[rom.version];
  if (!def) return undefined;

  const monSpriteTable = readArray(rom, def);
  return monSpriteTable.map((buf, i) => {
    const num = i + 1;

    const [tilesWidth, tilesHeight] = nibbles(buf.readUInt8(0));

    const romBank = buf.readUInt8(1);
    const addr = buf.readUInt16LE(2);
    const romOffset = (addr - 0x4000) + romBank * 0x4000;

    if (buf.length > 4) {
      // GBC only, so probably palette data.
    }

    return { num, tilesWidth, tilesHeight, romOffset };
  });
}


const effectTableDefs = {
  //'gb-jp': ?,
  //'gbc-jp': ?,
  'gbc-en': {
    offset: 0x40000,
    elemSize: 14,
    numElems: 90,
  },
};

function gatherEffects(rom) {
  const def = effectTableDefs[rom.version];
  if (!def) return undefined;

  const effectTable = readArray(rom, def);
  return effectTable.map((buf, i) => {
    const num = i + 1;
    const name = rom.decodeText(buf.slice(0,12));
    //const _unknown = buf.readUInt8(12);
    const cost = buf.readUInt8(13);

    return {
      num, name, cost,
    };
  });
}


const itemTableDefs = {
  //'gb-jp': ?,
  //'gbc-jp': ?,
  'gbc-en': {
    offset: 0x405c4,
    elemSize: 23,
    numElems: 105,
  },
};

function gatherItems(rom) {
  const def = itemTableDefs[rom.version];
  if (!def) return undefined;

  const itemTable = readArray(rom, def);
  return itemTable.map((buf, i) => {
    const num = i + 1;
    const name = rom.decodeText(buf.slice(0,12));
    //const unknown = buf.readUInt8(pos+12);
    let sellPrice = buf.readUInt16LE(13);
    let buyPrice = sellPrice + (sellPrice >>> 1); // mask this to 16 bits?

    return {
      num, name, sellPrice, buyPrice,
    };
  });
}




function nibbles(x) {
  return [x & 0xf, (x >>> 4) & 0xf];
}

function readArray(rom, def) {
  const offset = def.offset;
  const elemSize = def.elemSize;
  const numElems = def.numElems;
  const arrSize = numElems * elemSize;
  const buf = rom.read(offset, arrSize);

  const elems = []
  let idx = 0;
  for (let i = 0; i !== numElems; i++) {
    elems[i] = buf.slice(idx, idx+elemSize);
    idx += elemSize;
  }
  return elems;
}
