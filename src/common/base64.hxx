#pragma once
#include <ostream>
#include "span.hxx"
#include "types.hxx"

// Adapted from René Nyffenegger's base64.cpp

constexpr const char base64_chars[] =
  u8"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

/// `os << base64_encode{data}` writes the base64 representation
/// of data to `os`.
struct base64_encode {
  span<const u8> data;

  friend inline auto operator<<(
    std::ostream& os,
    const base64_encode& x
  ) -> std::ostream& {
    u8 a_3[3];
    u8 a_4[4];

    int i = 0;
    for (u8 b: x.data) {
      a_3[i++] = b;
      if (i == 3) {
        a_4[0] = (a_3[0] & 0xfc) >> 2;
        a_4[1] = ((a_3[0] & 0x03) << 4) + ((a_3[1] & 0xf0) >> 4);
        a_4[2] = ((a_3[1] & 0x0f) << 2) + ((a_3[2] & 0xc0) >> 6);
        a_4[3] = a_3[2] & 0x3f;

        for (int j = 0; j != 4 ; j++)
          os.put(base64_chars[a_4[j]]);

        i = 0;
      }
    }

    if (i != 0) {
      for (int j = i; j != 3; j++)
        a_3[j] = '\0';

      a_4[0] = (a_3[0] & 0xfc) >> 2;
      a_4[1] = ((a_3[0] & 0x03) << 4) + ((a_3[1] & 0xf0) >> 4);
      a_4[2] = ((a_3[1] & 0x0f) << 2) + ((a_3[2] & 0xc0) >> 6);
      a_4[3] = a_3[2] & 0x3f;

      for (int j = 0; j != i + 1; j++)
        os.put(base64_chars[a_4[j]]);
      while (i++ < 3)
        os.put('=');
    }

    return os;
  }
};
