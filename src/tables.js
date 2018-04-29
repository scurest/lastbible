exports.gatherTables = function(rom) {
  return {
    monsters: gatherMonsters(rom),
    monsterSprites: gatherMonsterSprites(rom),
    items: gatherItems(rom),
    effects: gatherEffects(rom),
    strings: gatherStrings(rom),
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
    const [luk, unknownIgnored] = nibbles(buf.readUInt8(14));
    const luck = stat(luk);

    //const unknown1 = buf.readUInt8(15);
    //const unknown2 = buf.readUInt8(16);

    const [allySpellCount, enemySpellCount] = nibbles(buf.readUInt8(17));

    const spells = Array.from(buf.slice(18,22));
    while (spells[spells.length-1] === 0xff) spells.pop();

    //const [allyUnkCount, enemyUnkCount] = nibbles(buf.readUInt8(22));
    //const unk = Array.from(buf.slice(23,25));
    //while (unk[unk.length-1] === 0xff) unk.pop();

    const exp = buf.readUInt16LE(29);

    return {
      num, name, lvl, hp, mp, tribe,
      endurance, intelligence, strength, speed, luck,
      enemySpellCount, allySpellCount, spells,
      exp,
    };
  });
}


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

    const flags = buf.readUInt8(12);
    const usableInField = !!(flags & (1 << 0));
    const usableInBattle = !!(flags & (1 << 2));
    const targetsFullStack = !!(flags & (1 << 5));
    const targetsAll = !!(flags & (1 << 6));
    const targetsEnemies = !!(flags & (1 << 7));

    const cost = buf.readUInt8(13);

    return {
      num, name, cost,
      usableInField, usableInBattle, targetsFullStack, targetsAll, targetsEnemies,
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

    const flags = buf.readUInt8(12);
    const elCanUse = !!(flags & (1 << 0));
    const kisheCanUse = !!(flags & (1 << 1));
    const uranusCanUse = !!(flags & (1 << 2));
    const usableInField = !!(flags & (1 << 6));
    const usableInBattle = !!(flags & (1 << 7));

    const sellPrice = buf.readUInt16LE(13);
    const buyPrice = (sellPrice + (sellPrice >>> 1)) & 0xffff;

    const offense = buf.readUInt8(15);
    const defense = buf.readUInt8(17);

    let effect = buf.readUInt8(22);
    if (effect === 0xff) effect = null;

    return {
      num, name, sellPrice, buyPrice,
      elCanUse, kisheCanUse, uranusCanUse, usableInField, usableInBattle,
      offense, defense,
      effect,
    };
  });
}

const stringsTablesDefs = {
  "page-14": {
    //'gb-jp': ?,
    //'gbc-jp': ?,
    'gbc-en': {
      offset: 14*0x4000,
      elemSize: 2,
      numElems: 350,
    },
  },
  "page-32": {
    //'gb-jp': ?,
    //'gbc-jp': ?,
    'gbc-en': {
      offset: 32*0x4000,
      elemSize: 2,
      numElems: 180,
    },
  },
  "page-33": {
    //'gb-jp': ?,
    //'gbc-jp': ?,
    'gbc-en': {
      offset: 33*0x4000,
      elemSize: 2,
      numElems: 270,
    },
  },
  "page-34": {
    //'gb-jp': ?,
    //'gbc-jp': ?,
    'gbc-en': {
      offset: 34*0x4000,
      elemSize: 2,
      numElems: 217,
    },
  },
};

function gatherStrings(rom) {
  const strings = {};
  for (const pageName of Object.keys(stringsTablesDefs)) {
    const def = stringsTablesDefs[pageName][rom.version];
    if (!def) return undefined;

    const page = rom.read(def.offset, 0x4000);
    const stringsTable = readArray(rom, def);
    strings[pageName] = stringsTable.map((buf) => {
      const addr = buf.readUInt16LE(0);
      const off = addr - 0x4000;

      let end = off;
      while (end < page.length && page[end] !== 0xff) {
        end += 1;
      }

      const str = rom.decodeText(page.slice(off, end));

      return str;
    });
  }
  return strings;
}


function nibbles(x) {
  return [x & 0xf, (x >>> 4) & 0xf];
}

function readArray(rom, def) {
  const { offset, elemSize, numElems } = def;
  const arrSize = numElems * elemSize;
  const buf = rom.read(offset, arrSize);

  const elems = [];
  let idx = 0;
  for (let i = 0; i !== numElems; i++) {
    elems[i] = buf.slice(idx, idx + elemSize);
    idx += elemSize;
  }
  return elems;
}
