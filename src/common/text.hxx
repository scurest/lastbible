#pragma once
#include <ostream>
#include "span.hxx"
#include "types.hxx"

/// `os << encode_utf8 {c}` writes the UTF-8 byte sequence for the
/// codepoint `c` to `os`.
struct encode_utf8 {
  char16_t c;

  friend auto operator<<(
    std::ostream& os,
    encode_utf8 x
  ) -> std::ostream& {
    char16_t c = x.c;
    if (c < 0x80u) {
      os.put(c);
    }
    else if (x.c < 0x800u) {
      os.put(0xc0 | (c >> 6));
      os.put(0x80 | (c & 0x3f));
    }
    else {
      os.put(0xe0 | (c >> 12));
      os.put(0x80 | ((c >> 6) & 0x3f));
      os.put(0x80 | (c & 0x3f));
    }
    return os;
  }
};


constexpr const char16_t charset[] =
  u"０１２３４５６７８９あいうえおかきくけこさしすせそたちつてとなに"
   "ぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅ"
   "ょアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマ"
   "ミムメモヤユヨラリルレロワヲンァィゥェォッャュョ゛゜HMP？！ー"
   "���������������　がぎぐげござじずぜぞだぢづでどば"
   "びぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピ"
   "プペポ�����������������������������"
   "��������������������������������";
constexpr usize kana_start = 0xa;
constexpr usize kana_end = 0x78;

/// `os << decode_text {text}` converts the character encoding used by
/// Last Bible to UTF-8 and writes it to `os`.
struct decode_text {
  span<const u8> text;

  friend auto operator<<(
    std::ostream& os,
    const decode_text& x
  ) -> std::ostream& {
    auto last_was_kana = false;
    for (auto b : x.text) {
      auto c = charset[b];
      // Beautify dakuten (か゛ -> が)
      if (last_was_kana && c == u'゛') {
        c = u'\u3099'; // combining dakuten
      }
      else if (last_was_kana && c == u'゜') {
        c = u'\u309a'; // combining handakuten
      }
      os << encode_utf8 {c};
      last_was_kana = kana_start <= b && b < kana_end;
    }
    return os;
  }
};


constexpr const char16_t en_charset[] =
  u"0123456789ABCDEFGHIJKLMNOPQRSTUV"
   "WXYZ\"#$%&'*()+,-./:;<=>[?]?_{|}~"
   " abcdefghijklmnopqrstuvwxyz�����"
   "��������������������������HMP?! "
   "��������������� ����������������"
   "��������������������������������"
   "��������������������������������"
   "��������������������������������";

/// `os << decode_en_text_escape_html {text}` converts the text encoding
/// for Revelations: The Demon Slayer into UTF-8 and writes it to `os`.
struct decode_en_text_escape_html {
  span<const u8> text;

  friend auto operator<<(
    std::ostream& os,
    const decode_en_text_escape_html& x
  ) -> std::ostream& {
    for (auto b : x.text) {
      auto c = en_charset[b];
      if (c == u'&') {
        os << u8"&amp;";
      }
      else if (c == u'<') {
        os << u8"&lt;";
      }
      else {
        os << encode_utf8{c};
      }
    }
    return os;
  }
};
