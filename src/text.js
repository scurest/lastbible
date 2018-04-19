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
  let s = '';
  for (let i = 0; i !== bytes.length; i++) {
    s += enCharset[bytes[i]];
  }
  return s;
};

exports.decoders = {
  'jp': exports.decodeJp,
  'en': exports.decodeEn,
};
