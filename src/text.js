const jp_charset =
  '０１２３４５６７８９あいうえおかきくけこさしすせそたちつてとなに' +
  'ぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅ' +
  'ょアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマ' +
  'ミムメモヤユヨラリルレロワヲンァィゥェォッャュョ゛゜HMP？！ー' +
  '���������������　がぎぐげござじずぜぞだぢづでどば' +
  'びぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピ' +
  'プペポ�����������������������������' +
  '��������������������������������';

const kana_start = 0x0a;
const kana_end = 0x78;

exports.decode_jp = function(bytes) {
  let s = '';
  let last_was_kana = false;
  for (let i = 0; i !== bytes.length; i++) {
    const c = jp_charset[bytes[i]];

    // Beautify dakuten (か + ゛-> が)
    if (last_was_kana && c === '゛') {
      s += '\u3099'; // combining dakuten
    } else if (last_was_kana && c === '゜') {
      s += '\u309a'; // combining handakuten
    } else {
      s += c;
    }

    last_was_kana = kana_start <= bytes[i] && bytes[i] < kana_end;
  }
  return s;
}

const en_charset =
  '0123456789ABCDEFGHIJKLMNOPQRSTUV' +
  'WXYZ"#$%&\'*()+,-./:;<=>[?]?_{|}~' +
  ' abcdefghijklmnopqrstuvwxyz�����' +
  '��������������������������HMP?! ' +
  '��������������� ����������������' +
  '��������������������������������' +
  '��������������������������������' +
  '��������������������������������';

exports.decode_en = function(bytes) {
  let s = '';
  for (let i = 0; i !== bytes.length; i++) {
    s += en_charset[bytes[i]];
  }
  return s;
}

exports.decoders = {
  'jp': exports.decode_jp,
  'en': exports.decode_en,
};
