#include <cstdio>
#include "lodepng/lodepng.h"
#include "common/chunks.hxx"
#include "common/fileio.hxx"
#include "common/gameboy.hxx"
#include "common/pack2bit.hxx"
#include "common/span.hxx"
#include "common/types.hxx"
#include "common/vec2d.hxx"

// The world map is 224x160 tiles. Instead of storing every tile index individually,
// they're clumped together into groups of 2x2 tiles, called a block4, and then groups
// of 2x2 block4s, called a block16.
//
// The map is stored as an array of indices into a table of block16s. Each entry in this
// table is an array of 4 indices into a table of block4s. Each entry in this table is an
// array of 4 indices into the tileset that will exist in VRAM.

struct tile_data {
  chunks<const u8> tileset;
  chunks<const u8> block4s;
  chunks<const u8> block16s;
};

constexpr usize world_map_off = 0x18116;
constexpr usize world_width_tiles = 224;
constexpr usize world_height_tiles = 160;

void draw_block4(const tile_data& td, span_2d<u8> rect, u8 id) {
  auto block = td.block4s[id];
  // The tiles are loaded into VRAM starting at ID 0x90, so we
  // subtract this offset to get the index into the tileset.
  auto off = 0x90;
  gb::draw_tile(td.tileset[block[0] - off], rect.subrect(0,0,8,8));
  gb::draw_tile(td.tileset[block[1] - off], rect.subrect(8,0,8,8));
  gb::draw_tile(td.tileset[block[2] - off], rect.subrect(0,8,8,8));
  gb::draw_tile(td.tileset[block[3] - off], rect.subrect(8,8,8,8));
}

void draw_block16(const tile_data& td, span_2d<u8> rect, u8 id) {
  auto block = td.block16s[id];
  draw_block4(td, rect.subrect(0,0,16,16), block[0]);
  draw_block4(td, rect.subrect(16,0,16,16), block[1]);
  draw_block4(td, rect.subrect(0,16,16,16), block[2]);
  draw_block4(td, rect.subrect(16,16,16,16), block[3]);
}

auto draw_worldmap(span<const u8> rom) -> vec_2d<u8> {
  chunks<const u8> tileset = { rom.begin() + 0x2009b, 16 * 8, 16 };
  chunks<const u8> block4s = { rom.begin() + 0x6e69, 255, 4 };
  chunks<const u8> block16s = { rom.begin() + 0x1c112, 255, 4 };
  tile_data td { tileset, block4s, block16s };

  auto world_width_block16s = world_width_tiles / 4;
  auto world_height_block16s = world_height_tiles / 4;
  auto world_area_block16s = world_width_block16s * world_height_block16s;

  auto map_data = rom.slice_len(world_map_off, world_area_block16s);
  vec_2d<u8> out (8*world_width_tiles, 8*world_height_tiles);

  usize idx = 0;
  for (usize y = 0; y != world_height_block16s; ++y) {
    for (usize x = 0; x != world_width_block16s; ++x) {
      auto rect = span_2d<u8>(out).subrect(32*x,32*y,32,32);
      draw_block16(td, rect, map_data[idx++]);
    }
  }

  return out;
}

auto main(int argc, zstring* argv) -> int {
  if (argc != 3) {
    fputs("Usage: worldmap /path/to/rom.gb out.png\n", stderr);
    return 1;
  }

  auto rom = fileio::read_file(argv[1]);
  auto img = draw_worldmap(rom);

  auto w = img.width();
  auto h = img.height();
  auto buf = pack_2bit_buffer(std::move(img));
  lodepng::encode(argv[2], buf.data(), w, h, LCT_GREY, 2);
}
