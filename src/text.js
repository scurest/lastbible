// Decodes text.
//
// Text is decoded to either a string or a sequence of _pieces_. Each piece is
// either a string or an object representing a control code in the text (such as
// "wait for the player to press A").

const jpCharset =
  '０１２３４５６７８９あいうえおかきくけこさしすせそたちつてとなに' +
  'ぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅ' +
  'ょアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマ' +
  'ミムメモヤユヨラリルレロワヲンァィゥェォッャュョ゛゜HMP？！ー' +
  '���������������　がぎぐげござじずぜぞだぢづでどば' +
  'びぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピ' +
  'プペポ�����������������������������' +
  '��������������������������������';

const kanaStart = 0x0a;
const kanaEnd = 0x78;

exports.decodeJp = function(bytes) {
  // TODO: this doesn't do pieces yet
  let s = '';
  let lastWasKana = false;
  for (let i = 0; i !== bytes.length; i++) {
    const c = jpCharset[bytes[i]];

    // Beautify dakuten (か + ゛-> が)
    if (lastWasKana && c === '゛') {
      s += '\u3099'; // combining dakuten
    } else if (lastWasKana && c === '゜') {
      s += '\u309a'; // combining handakuten
    } else {
      s += c;
    }

    lastWasKana = kanaStart <= bytes[i] && bytes[i] < kanaEnd;
  }
  return s.normalize();
};

const enCharset =
  '0123456789ABCDEFGHIJKLMNOPQRSTUV' +
  'WXYZ"#$%&\'*()+,-./:;<=>[?]?_{|}~' +
  ' abcdefghijklmnopqrstuvwxyz�����' +
  '��������������������������HMP?! ' +
  '��������������� ����������������' +
  '��������������������������������' +
  '��������������������������������' +
  '��������������������������������';

exports.decodeEn = function(bytes) {
  const pieces = [];
  // The current string piece that we're accumulating
  let s = '';
  // Push a piece onto the list of pieces. Also finished the current piece we're
  // accumulating.
  const push = (piece) => {
    if (s !== '') pieces.push(s);
    s = '';
    if (piece) pieces.push(piece);
  };

  for (let i = 0; i !== bytes.length; i++) {
    const b = bytes[i];
    switch (b) {
      case 0xff: {
        // Marks the end of the string (like a NUL byte).
        push({ ty: 'END' });
        break;
      }
      case 0xfe: {
        // Newline
        push({ ty: 'NEWLINE' });
        break;
      }
      case 0xfd: {
        // Displays a hero's name. The next byte tells us which hero.
        i += 1;
        let which;
        if (bytes.length !== i) which = bytes[i];
        push({ ty: 'HERONAME', which });
        break;
      }
      case 0xf3: {
        // Displays flashing arrow and waits for you to press A
        push({ ty: 'WAITFORBUTTON'});
        break;
      }
      case 0xf0: {
        // Text display scrolls one line up
        push({ ty: 'SCROLLUP' });
        break;
      }
      default: {
        const c = enCharset[b];
        if (c === '�') {
          push({ ty: 'UNKNOWN', code: b});
        } else {
          s += c;
        }
        break;
      }
    }
  }
  push();

  if (pieces.length === 0) return "";
  if (pieces.length === 1 && typeof pieces[0] === 'string') return pieces[0];
  return pieces;
};

exports.decoders = {
  'jp': exports.decodeJp,
  'en': exports.decodeEn,
};
