const roms = require('./roms.js');
const Image = require('./draw.js').Image;

exports.writeDb = function(rom, db) {
  const lang = roms.versions[rom.version].lang;
  const title = roms.versions[rom.version].name;
  let s =
    '<!doctype html>\n' +
    `<html lang=${lang}>\n` +
    '<meta charset=utf-8>\n' +
    `<title>Last Bible Database :: ROM: ${title}</title>\n\n`;

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
  s += '</ul>\n';

  if (db.monsters) {
    s +=
      '<h3 id=monsters>Monsters</h3>\n';
    s +=
      '<table border=1>\n' +
      '<tr><th>No. <th>Name <th>Lvl <th>HP <th>MP <th>Tribe <th>End <th>Int <th>Str <th>Spd <th>Luck <th>Spells <th>\n';
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
    s +=
      '<h3 id=items>Items</h3>\n';
    s +=
      '<table border=1>\n' +
      '<tr><th>No. <th>Name <th>Buy Price <th>Sell Price\n';
    for (let i = 0; i !== db.items.length; i++) {
      const item = db.items[i];
      s += `<tr id=item-${i}>`;
      s += `<td>${item.num} `;
      s += `<td>${item.name.trim()} `;

      if (item.sellPrice !== 0xffff) {
        s += `<td>${item.buyPrice} `;
        s += `<td>${item.sellPrice} `;
      } else {
        s += `<td>— <td>— `;
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
      '<tr><th>No. <th>Name <th>Cost\n';
    for (let i = 0; i !== db.effects.length; i++) {
      const effect = db.effects[i];
      s += `<tr id=effect-${i}>`;
      s += `<td>${effect.num} `;
      s += `<td>${effect.name.trim()} `;
      s += `<td>${effect.cost} `;
      s += '\n';
    }
    s += '</table>\n\n';
  }

  return s;
}

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
  const dataUri = 'data:image/png;base64,'+Buffer.from(img.toPng()).toString('base64');
  const imgTag = `<img src="${dataUri}">`;
  return imgTag;
}
