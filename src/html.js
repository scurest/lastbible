const roms = require('./roms.js');
const { Image } = require('./draw.js');

exports.writeDb = function(rom, db) {
  const lang = roms.versions[rom.version].lang;
  const title = roms.versions[rom.version].name;
  let s = '';
  s += '<!doctype html>\n';
  s += `<html lang=${lang}>\n`;
  s += '<meta charset=utf-8>\n';
  s += `<title>Last Bible Database :: ROM: ${title}</title>\n`;
  s += '<style>.text-code { background:#000; color:#fff; padding:0 2px; margin:0 2px; }</style>\n';
  s += '\n';

  s += '<h2>ROM Info</h2>\n';
  s += '<ul>\n';
  s += `<li>ROM: ${roms.versions[rom.version].name}\n`;
  s += `<li>Language: ${roms.versions[rom.version].lang}\n`;
  s += `<li>Generated On: ${new Date().toLocaleString()}\n`;
  s += '</ul>\n\n';

  s += '<h2>Tables</h2>\n';

  s += '<ul>\n';
  if (db.monsters) s += '<li><a href="#monsters">Monsters</a>\n';
  if (db.items) s += '<li><a href="#items">Items</a>\n';
  if (db.effects) s += '<li><a href="#effects">Effects</a>\n';
  if (db.strings) s += '<li><a href="#strings">Strings</a>\n';
  s += '</ul>\n';

  if (db.monsters) {
    s += '<h3 id=monsters>Monsters</h3>\n';
    s += '<table border=1>\n';
    s +=
      '<tr><th>No. <th>Name <th>Lvl <th>HP <th>MP <th>Tribe ' +
      '<th>End <th>Int <th>Str <th>Spd <th>Luck <th>EXP <th>Spells <th>\n';
    for (let i = 0; i !== db.monsters.length; i++) {
      const mon = db.monsters[i];

      s += `<tr id=monster-${i}>`;
      s += `<td>${mon.num} `;
      s += `<td>${mon.name.trim()} `;
      s += `<td>${mon.lvl} `;
      s += `<td>${mon.hp} `;
      s += `<td>${mon.mp} `;
      s += `<td>${mon.tribe} `;
      s += `<td>${mon.endurance} `;
      s += `<td>${mon.intelligence} `;
      s += `<td>${mon.strength} `;
      s += `<td>${mon.speed} `;
      s += `<td>${mon.luck} `;
      s += `<td>${mon.exp} `;

      s += '<td>';
      if (db.effects) {
        for (let j = 0; j !== mon.spells.length; j++) {
          const effectIdx = mon.spells[j];
          const spellName = db.effects[effectIdx].name.trim();
          s += `<a href="#effect-${effectIdx}">${spellName}</a>`;
          if (j >= mon.allySpellCount) {
            s += ' (Enemy only)';
          } else if (j >= mon.enemySpellCount) {
            s += ' (Ally only)';
          }
          s += '<br>';
        }
      }

      s += '<td>';
      if (db.monsterSprites) {
        s += drawSpriteToImgTag(rom, db.monsterSprites[i]);
      }

      s += '\n';
    }
    s += '</table>\n\n';
  }


  if (db.items) {
    s += '<h3 id=items>Items</h3>\n';
    s += '<table border=1>\n';
    s +=
      '<tr><th>No. <th>Name <th>Buy Price <th>Sell Price ' +
      '<th>El Can Use? <th>Kishe Can Use? <th>Uranus Can Use? ' +
      '<th>Usable in Field? <th>Usable In Battle? ' +
      '<th>Offense <th> Defense ' +
      '<th>Effect\n';
    for (let i = 0; i !== db.items.length; i++) {
      const item = db.items[i];
      s += `<tr id=item-${i}>`;
      s += `<td>${item.num} `;
      s += `<td>${item.name.trim()} `;
      s += `<td>${item.buyPrice} `;
      s += `<td>${item.sellPrice} `;

      const mark = (x) => (x ? 'x' : '');
      s += `<td>${mark(item.elCanUse)} `;
      s += `<td>${mark(item.kisheCanUse)} `;
      s += `<td>${mark(item.uranusCanUse)} `;
      s += `<td>${mark(item.usableInField)} `;
      s += `<td>${mark(item.usableInBattle)} `;

      s += `<td>${item.offense} `;
      s += `<td>${item.defense} `;

      s += '<td>';
      if (db.effects && item.effect) {
        const effectName = db.effects[item.effect].name.trim();
        s += `<a href="#effect-${item.effect}">${effectName}</a>`;
      }

      s += '\n';
    }
    s += '</table>\n\n';
  }


  if (db.effects) {
    s +=
      '<h3 id=effects>Effects</h3>\n';
    s +=
      '<table border=1>\n' +
      '<tr><th>No. <th>Name <th>Cost <th>Use in Field? <th>Use in Battle? <th>Targets Full Stack? <th>Targets All? <th>Targets Enemies?\n';
    for (let i = 0; i !== db.effects.length; i++) {
      const effect = db.effects[i];
      s += `<tr id=effect-${i}>`;
      s += `<td>${effect.num} `;
      s += `<td>${effect.name.trim()} `;
      s += `<td>${effect.cost} `;

      const mark = (x) => (x ? 'x' : '');
      s += `<td>${mark(effect.usableInField)} `;
      s += `<td>${mark(effect.usableInBattle)} `;
      s += `<td>${mark(effect.targetsFullStack)} `;
      s += `<td>${mark(effect.targetsAll)} `;
      s += `<td>${mark(effect.targetsEnemies)} `;
      s += '\n';
    }
    s += '</table>\n\n';
  }

  if (db.strings) {
    s += '<h3 id=strings>Strings</h3>\n';
    for (const page in db.strings) {
      s += `<h4>${page}</h4>\n`;
      s += '<table border=1>\n';
      for (const str of db.strings[page]) {
        s += `<tr><td>${textToHtml(str)}\n`;
      }
      s += '</table>\n';
    }
    s += '\n';
  }

  return s;
};


function drawSpriteToImgTag(rom, sprite) {
  const buffer = rom.read(sprite.romOffset, 16*sprite.tilesHeight*sprite.tilesWidth);
  const img = new Image(sprite.tilesWidth*8, sprite.tilesHeight*8);
  let idx = 0;
  for (let y = 0; y !== sprite.tilesHeight; y++) {
    for (let x = 0; x !== sprite.tilesWidth; x++) {
      const tileBuf = buffer.slice(idx, idx+16);
      img.drawTile(tileBuf, 8*x, 8*y);
      idx += 16;
    }
  }
  const png = img.toPng();
  const dataUri = `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
  const imgTag = `<img src="${dataUri}">`;
  return imgTag;
}


function textToHtml(pieces) {
  if (typeof pieces === 'string') {
    return escapeHtml(pieces);
  }
  let result = '';
  for (const piece of pieces) {
    if (typeof piece === 'string') {
      result += escapeHtml(piece);
    } else {
      if (piece.ty === 'END') {
        result += '<span class=text-code>END</span>';
      } else if (piece.ty === 'NEWLINE' || piece.ty === 'SCROLLUP') {
        result += '<br>\n';
      } else if (piece.ty === 'HERONAME') {
        let hero;
        if (piece.which === 0) hero = 'El';
        else if (piece.which === 1) hero = 'Kishe';
        else if (piece.which === 2) hero = 'Uranus';
        else hero = `Hero ${piece.which}`;
        result += `<span class=text-code>${hero}</span>`;
      } else if (piece.ty === 'WAITFORBUTTON') {
        result += ' ▾';
      } else if (piece.ty === 'UNKNOWN') {
        result += `<span class=text-code>0x${piece.code.toString(16)}</span>`;
      }
    }
  }
  return result;
}

const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, function (s) {
    return htmlEscapes[s];
  });
}
