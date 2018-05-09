// Decodes text.
//
// Text contains control codes (eg. "wait for the player to press A"), so it
// decodes to either a string, or a sequence of _pieces_. Each piece is either a
// string or an object representing a control code. The ty property of the
// object tells you what kind of control code and the other properties give
// additional parameters.

const charsets = {
  jp:
    '０１２３４５６７８９あいうえおかきくけこさしすせそたちつてとなに' +
    'ぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅ' +
    'ょアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマ' +
    'ミムメモヤユヨラリルレロワヲンァィゥェォッャュョ゛゜HMP？！ー' +
    '���������������　がぎぐげござじずぜぞだぢづでどば' +
    'びぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピ' +
    'プペポ�����������������������������' +
    '��������������������������������',
  en:
    '0123456789ABCDEFGHIJKLMNOPQRSTUV' +
    'WXYZ"#$%&\'*()+,-./:;<=>[?]?_{|}~' +
    ' abcdefghijklmnopqrstuvwxyz�����' +
    '��������������������������HMP?! ' +
    '��������������� ����������������' +
    '��������������������������������' +
    '��������������������������������' +
    '��������������������������������',
};

// Characters in the range charsets.jp[kanaStart..kanaEnd] are kana.
const kanaStart = 0x0a;
const kanaEnd = 0x78;

exports.decodeText = function(lang, bytes) {
  const charset = charsets[lang];

  const pieces = [];
  // The current string piece that we're accumulating
  let s = '';
  // Push a piece onto the list of pieces.
  const push = (piece) => {
    // Add any current string to the list.
    if (s !== '') {
      // Normalize because some programs don't like combining characters.
      if (lang === 'jp') s = s.normalize();
      pieces.push(s);
    }
    s = '';
    if (piece) pieces.push(piece);
  };

  // For Japanese, whether the last character was a kana (so we know whether we
  // can attach a combining dakuten to it).
  let lastWasKana = false;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    switch (b) {
      // Handle control characters
      case 0xff: {
        // Marks the end of the string (like a NUL byte in C).
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
        if (i < bytes.length) which = bytes[i];
        push({ ty: 'HERONAME', which });
        break;
      }
      case 0xfb: {
        // Prompt player for Yes/No
        push({ ty: 'YESNO' });
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
        const c = charset[b];
        if (c === '�') {
          push({ ty: 'UNKNOWN', code: b});
        } else if (lang === 'jp') {
          // Beautify dakuten (か + ゛-> が)
          if (lastWasKana && c === '゛') {
            s += '\u3099'; // combining dakuten
          } else if (lastWasKana && c === '゜') {
            s += '\u309a'; // combining handakuten
          } else {
            s += c;
          }
          lastWasKana = kanaStart <= b && b < kanaEnd;
        } else {
          s += c;
        }
        break;
      }
    }
  }
  // Push any remaining string onto the list
  push();

  if (pieces.length === 0) return '';
  if (pieces.length === 1 && typeof pieces[0] === 'string') return pieces[0];
  return pieces;
};

exports.decoders = {
  jp: text => exports.decodeText('jp', text),
  en: text => exports.decodeText('en', text),
};
