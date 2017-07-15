#pragma once
#include <cassert>
#include "span.hxx"
#include "types.hxx"
#include "vec2d.hxx"

namespace gb {

struct not_a_rom_page {};

/// Gets the location in the ROM corresponding to an access to address `addr` while
/// page `page` is swapped in.
constexpr auto rom_off_from_page_addr(u8 page, u16 addr) -> usize {
  if (addr < 0x4000) return addr;
  else if (addr < 0x8000) return page * usize(0x4000) + (addr - 0x4000);
  else throw not_a_rom_page {};
}

/// Draws a tile to `rect`. The color number (0-3) is written.
/// See <http://gbdev.gg8.se/wiki/articles/Video_Display#VRAM_Tile_Data>
inline void draw_tile(span<const u8> tile, span_2d<u8> rect) {
  assert(rect.width >= 8);
  assert(rect.height >= 8);

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

}
