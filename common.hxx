#include <cassert>
#include <cstdint>
#include <cstdio>
#include <iterator>
#include <tuple>
#include <utility>
#include <vector>

#include "lodepng.h"

using u8 = std::uint8_t;
using u16 = std::uint16_t;
using u32 = std::uint32_t;
using u64 = std::uint64_t;
using usize = std::size_t;


// arrays and views
// ================

/// A view onto a section of an array.
template <class T>
struct span {
  T* begin_;
  T* end_;

  constexpr span(T* b, T* e) : begin_(b), end_(e) {}
  span(std::vector<T>& v) : span(v.data(), v.data() + v.size()) {}

  constexpr auto begin() const -> T* { return begin_; }
  constexpr auto end() const -> T* { return end_; }

  constexpr auto size() -> usize { return end_ - begin_; }

  constexpr auto operator[](usize pos) const -> T& {
    return begin_[pos];
  }

  constexpr auto slice(usize l_idx, usize r_idx) -> span<T> {
    return { begin_ + l_idx, begin_ + r_idx };
  }
};

/// Views an array of bytes as an array of `len` chunks, each of `chunk_size` bytes.
struct chunks {
  u8* start;
  usize len;
  usize chunk_size;

  constexpr auto operator[](usize pos) const -> span<u8> {
    auto begin = start + chunk_size * pos;
    auto end = begin + chunk_size;
    return { begin, end };
  }
};

/// A view onto a rectangular region of a 2D array.
template <class T>
struct span_2d {
  T* begin;
  usize pitch;
  usize width;
  usize height;

  using index_type = std::pair<usize, usize>;

  constexpr auto operator[](index_type pos) const -> T& {
    return begin[pos.second*pitch + pos.first];
  }

  constexpr auto subrect(usize x, usize y, usize w, usize h) const -> span_2d<T> {
    auto new_begin = begin + y*pitch + x;
    return { new_begin, pitch, w, h};
  }
};

/// A vector that holds a 2D array.
template <class T>
struct vec_2d {
  std::vector<T> vec;
  usize width;
  usize height;

  vec_2d(usize w, usize h) : vec(w*h), width(w), height(h) {}
  vec_2d(std::vector<T> v, usize w, usize h) : vec(std::move(v)), width(w), height(h) {}
  void resize(usize w, usize h) {
    vec.resize(w*h);
    width = w;
    height = h;
  }
  operator span_2d<T>() { return { vec.data(), width, width, height }; }
};


// File I/O
// ========

auto read_entire_file(const char* filename) -> std::vector<u8> {
  // I/O streams suck, so just do it the C way.
  auto f = fopen(filename, "rb");
  fseek(f, 0, SEEK_END);
  auto len = ftell(f);
  rewind(f);
  std::vector<u8> out(len);
  fread(out.data(), len, 1, f);
  fclose(f);
  return out;
}

void write_file(const char* filename, span<u8> bytes) {
  auto f = fopen(filename, "wb");
  fwrite(bytes.begin(), bytes.size(), 1, f);
  fclose(f);
}


// Game Boy routines
// =================

/// Gets the location in the ROM corresponding to an access to address `addr` while
/// page `page` is swapped in.
constexpr auto page_addr(u8 page, u16 addr) -> usize {
  assert(addr < 0x8000);
  if (addr < 0x4000) return addr;
  return page * usize(0x4000) + (addr - 0x4000);
}

/// Draws a tile to `rect`.
/// See eg. http://gbdev.gg8.se/wiki/articles/Video_Display#VRAM_Tile_Data
///
/// Only the color number (0-3) is written. No palette is taken into account. 
void draw_tile(span<u8> tile, span_2d<u8> rect) {
  usize idx = 0;
  for (auto y = 0; y != 8; ++y) {
    // data in the ROM is the complement of data in VRAM (idk why)
    auto b0 = ~tile[idx++];
    auto b1 = ~tile[idx++];
    for (auto x = 0; x != 8; ++x) {
      auto mask = 0x80 >> x;
      rect[{x,y}] = bool(b0 & mask) + (bool(b1 & mask) << 1);
    }
  }
}


// Text
// ====

/// A vector that holds UTF-8 data. Smooths over annoying bits of using
/// std::string (eg. writing u8s).
struct utf8_str {
  using value_type = u8;

  std::vector<u8> buf;

  void push_back(u8 b) {
    buf.push_back(b);
  }
  template <usize N>
  void append(char const (&s)[N]) {
    buf.insert(buf.end(), (u8*)s, (u8*)s + N - 1);
  }
  void append(const char* s) {
    auto len = strlen(s);
    buf.insert(buf.end(), (u8*)s, (u8*)s + len);
  }
  operator span<u8>() { return span<u8>(buf); }
};

/// Writes the UTF-8 encoding for the code point c to `it`.
/// Returns the position of the iterator after writing.
template <class OutputIt>
constexpr auto encode_utf8(OutputIt it, char16_t c) -> OutputIt {
  if (c < 0x80) {
    *it++ = u8(c);
  }
  else if (c < 0x800) {
    *it++ = u8(0xc0 | (c >> 6));
    *it++ = u8(0x80 | (c & 0x3f));
  }
  else {
    *it++ = u8(0xe0 | (c >> 12));
    *it++ = u8(0x80 | ((c >> 6) & 0x3f));
    *it++ = u8(0x80 | (c & 0x3f));
  }
  return it;
}

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

/// Decodes "Last Bible" text to UTF-8. Writes the UTF-8 to `it`.
template <class OutputIt>
auto decode_text(OutputIt it, span<u8> text) -> OutputIt {
  auto last_was_kana = false;
  for(u8 b : text) {
    auto c = charset[b];
    // Beautify dakuten (か゛ -> が)
    if (last_was_kana && c == u'゛') {
      c = u'\u3099'; // combining dakuten
    }
    else if (last_was_kana && c == u'゜') {
      c = u'\u309a'; // combining handakuten
    }
    it = encode_utf8(it, c);
    last_was_kana = kana_start <= b && b < kana_end;
  }
  return it;
}

constexpr const char16_t en_charset[] =
  u"0123456789ABCDEFGHIJKLMNOPQRSTUV"
   "WXYZ\"#$%&'*()+,-./:;<=>[?]?_{|}~"
   " abcdefghijklmnopqrstuvwxyz�����"
   "��������������������������HMP?! "
   "��������������� ����������������"
   "��������������������������������"
   "��������������������������������"
   "��������������������������������";

/// Decodes "Revelations" text to UTF-8. Writes the UTF-8 to `it`.
template <class OutputIt>
auto decode_en_text(OutputIt it, span<u8> text) -> OutputIt {
  for(u8 b : text) {
    auto c = en_charset[b];
    it = encode_utf8(it, c);
  }
  return it;
}

/// Print `i` as a numeral. The ASCII text is written to `it`.
/// Returns `it` after writing.
template <class OutputIt>
auto print(OutputIt it, u32 i) -> OutputIt {
  if (i == 0) {
    *it++ = '0';
    return it;
  }

  u8 buf[10];
  auto p = buf + 10;
  for (; i != 0; i /= 10) {
    *--p = '0' + (i % 10);
  }
  for (; p != buf + 10; ++p) {
    *it++ = *p;
  }

  return it;
}

// misc
// ====

/// lodepng wants 2-bit images packed into bytes (ie. with four pixels in one byte).
/// But we draw with one-pixel-one-byte (for simplicity). This function packs an image
/// into the format for PNG. The image is consumed and its buffer is reused for the
/// result.
auto pack_2bit_buffer(vec_2d<u8>&& im) -> std::vector<u8> {
  std::vector<u8> v(std::move(im.vec));
  usize len = v.size();
  usize w = im.width;

  usize trg = 0;
  usize src = 0;

  // For each scanline...
  while (src != len) {
    usize x;
    // Pack four bytes into one byte
    for (x = 0; x != (w/4)*4; ++x) {
      v[trg++] = (v[src] << 6) | (v[src+1] << 4) |(v[src+2] << 2) | v[src+3];
      src += 4;
    }
    // Pack any leftover bytes
    auto b = 0;
    switch (w - x) {
      case 3: b |= v[src+2] << 2;
      case 2: b |= v[src+1] << 4;
      case 1: b |= v[src] << 6;
        v[trg++] = b;
      default:
        /* nothing */;
    }
    src += w - x;
  }

  v.resize(trg);
  return v;
}

constexpr const char base64_chars[] = 
  u8"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

/// Encodes `data` to base64. Writes the base64 ASCII to `it`.
/// Adapted from René Nyffenegger's base64.cpp
template <class OutputIt>
auto base64_encode(OutputIt it, span<u8> data) -> OutputIt {
  u8 a_3[3];
  u8 a_4[4];

  int i = 0;
  for (u8 b: data) {
    a_3[i++] = b;
    if (i == 3) {
      a_4[0] = (a_3[0] & 0xfc) >> 2;
      a_4[1] = ((a_3[0] & 0x03) << 4) + ((a_3[1] & 0xf0) >> 4);
      a_4[2] = ((a_3[1] & 0x0f) << 2) + ((a_3[2] & 0xc0) >> 6);
      a_4[3] = a_3[2] & 0x3f;

      for(int j = 0; j != 4 ; j++)
        *it++ = u8(base64_chars[a_4[j]]);

      i = 0;
    }
  }

  if (i != 0) {
    for(int j = i; j != 3; j++)
      a_3[j] = '\0';

    a_4[0] = (a_3[0] & 0xfc) >> 2;
    a_4[1] = ((a_3[0] & 0x03) << 4) + ((a_3[1] & 0xf0) >> 4);
    a_4[2] = ((a_3[1] & 0x0f) << 2) + ((a_3[2] & 0xc0) >> 6);
    a_4[3] = a_3[2] & 0x3f;

    for (int j = 0; j != i + 1; j++)
      *it++ = u8(base64_chars[a_4[j]]);
    while(i++ < 3)
      *it++ = '=';
  }

  return it;
}
