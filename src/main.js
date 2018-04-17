const minimist = require('minimist');
const fs = require('fs');
const rl = require('readline-sync');
const roms = require('./roms.js');
const tables = require('./tables.js');
const html = require('./html.js');


try {
  main();
} catch(e) {
  console.error('ERROR', e);
  process.exit(1);
}

function main() {
  const startTime = new Date();

  // Parse CLI args
  const argv = minimist(process.argv.slice(2));
  if (argv.h || argv.help || argv._.length === 0) {
    showHelp();
    process.exit(2);
  }
  if (argv._.length !== 1) {
    throw 'expected exactly one argument (the path to a ROM)';
  }
  const outPath = argv.o || argv.output;
  if (!outPath) {
    throw 'where should I write output? Pass it with -o PATH';
  }
  const format = argv.f || argv.format || (outPath.endsWith('.json') ? 'json' : 'html');
  if (!(format === 'json' || format === 'html')) {
    throw "format must be 'json' or 'html'";
  }

  const rom = new roms.Rom(argv._[0]);

  console.log(`Cartridge: ${roms.versions[rom.version].name}`)
  console.log(`Language: ${roms.versions[rom.version].lang}`)
  console.log(`Output Path: ${outPath}`);
  console.log(`Output Format: ${format}`);

  if (rom.version !== 'gbc-en') {
    throw 'dumping Japanese ROMs is currently broken, sorry :-(';
  }

  // Open the output path for writing. If it exists and we didn't get a -y flag,
  // confirm overwriting with the user.
  let outFd;
  try {
    outFd = fs.openSync(outPath, 'wx');
  } catch(e) {
    if (e.code !== 'EEXIST') { throw e; }

    let retry = false;
    if (argv.y === true) {
      retry = true;
    } else {
      let resp = rl.question('Output file exists. Overwrite? (y/n) ');
      retry = (resp === 'y' || resp === 'Y');
    }
    if (retry) {
      outFd = fs.openSync(outPath, 'w+');
    } else {
      process.exit(2);
    }
  }

  const db = tables.gatherTables(rom);

  let contents;
  if (format === 'json') {
    contents = JSON.stringify(db, null, 2);
  } else if (format === 'html') {
    contents = html.writeDb(rom, db);
  }
  const outBuf = Buffer.from(contents, 'utf-8');
  fs.writeSync(outFd, outBuf);
  fs.closeSync(outFd);

  const endTime = new Date();
  const elapsedSecs = (endTime - startTime) / 1000;
  console.log(`Done in ${elapsedSecs}s.`)
}

function showHelp() {
  console.info(
    'node main.js [flags] rom.gb -o output-file\n' +
    '\n' +
    'Flags\n' +
    '  -f {json,html}   Output format\n' +
    '  -y               Confirm overwrite output file\n'
  );
}
