#include <cstdio>
#include <sstream>
#include <vector>
#include "lodepng/lodepng.h"
#include "common/base64.hxx"
#include "common/chunks.hxx"
#include "common/fileio.hxx"
#include "common/gameboy.hxx"
#include "common/optional.hxx"
#include "common/pack2bit.hxx"
#include "common/span.hxx"
#include "common/text.hxx"
#include "common/types.hxx"
#include "common/vec2d.hxx"

// The table of monster data is located at mons_off. The entries look like
//   mon {
//     name: u8[7],
//     lvl: u8,
//     hp: u16le,
//     mp: u8,
//     tribe: u8,
//     unknown: u8[20],
//   }
//
// The table of monster graphic data is located at mon_gfxs_off. The entries
// look like
//   gfx_entry {
//     (height << 4) | width: u8,
//     page: u8,
//     addr: u16le,
//   }
// To draw one, page is swapped in and width*height tiles are read from addr.

constexpr usize mons_off = 0x14f0a;
constexpr usize en_mons_off = 0x166dc;
constexpr usize mon_gfxs_off = 0x14d45;
constexpr usize num_mons = 113;

/// Draws w*h tiles from a sequence of tiles to rect. Produces h rows of w tiles,
/// in the usual left-to-right top-to-bottom order.
void draw_tiles_to_rect(span<const u8> tiles, usize w, usize h, span_2d<u8> rect) {
  auto num_tiles = w * h;
  chunks<const u8> tile_chunks { tiles.begin(), num_tiles, 16 };

  usize idx = 0;
  for (usize y = 0; y != h; ++y) {
    for (usize x = 0; x != w; ++x) {
      auto tile = tile_chunks[idx++];
      gb::draw_tile(tile, rect.subrect(8*x, 8*y, 8, 8));
    }
  }
}

/// Draws a monster graphics, given an entry in the monster graphics table.
/// The image is placed in `buf`.
void mon_graphic(span<const u8> rom, span<const u8> entry, vec_2d<u8>& buf) {
  auto height = (entry[0] & 0xf0) >> 4;
  auto width = entry[0] & 0x0f;
  auto page = entry[1];
  u16 addr = u16(entry[2]) + (u16(entry[3]) << 8);

  auto off = gb::rom_off_from_page_addr(page, addr);
  auto tiles = rom.slice_len(off, 16*width*height);
  buf.resize(8*width, 8*height);
  draw_tiles_to_rect(tiles, width, height, buf);
}

/// Write an HTML table of monster data to `w`. If `en_rom` is given,
/// the table will contain English names as well.
void mon_table(
  std::ostringstream& w,
  span<const u8> rom,
  optional<span<const u8>> en_rom = {}
) {
  chunks<const u8> mons { rom.begin() + mons_off, num_mons, 32 };
  chunks<const u8> mon_gfxs { rom.begin() + mon_gfxs_off, num_mons, 4 };
  auto en_mons = map_opt(en_rom, [](span<const u8> en_rom) {
    return chunks<const u8> { en_rom.begin() + en_mons_off, num_mons, 32 };
  });

  std::vector<u8> img_buf;
  std::vector<u8> png_buf;

  w << u8"<table border=1>\n";

  // Table header
  w <<
    u8"<tr>" <<
      u8"<th>No."
      u8"<th lang=ja>名前" <<
      (en_rom ? u8"<th>Name" : "") <<
      u8"<th>Lvl"
      u8"<th>HP"
      u8"<th>MP"
      u8"<th>Tribe"
      u8"<th>"
      u8"\n";

  for (usize i = 0; i != num_mons; ++i) {
    auto mon_num = i + 1;

    auto mon_name = mons[i].slice(0,7);

    auto en_mon_name = map_opt(en_mons, [=](chunks<const u8> en_mons) {
      return en_mons[i].slice(0,7);
    });
    auto en_name_printer = maybe_print(
      map_opt(en_mon_name, [](span<const u8> en_mon_name) {
        return decode_en_text_escape_html {en_mon_name};
      })
    );

    auto mon_lvl = +mons[i][7];
    auto mon_hp = mons[i][8] | (mons[i][9] << 8);
    auto mon_mp = +mons[i][10];
    auto mon_tribe = +mons[i][11];

    auto gfx = mon_gfxs[i];
    vec_2d<u8> img { std::move(img_buf), 0, 0 };
    mon_graphic(rom, gfx, img);
    auto width = img.width();
    auto height = img.height();
    img_buf = pack_2bit_buffer(std::move(img));
    png_buf.clear();
    lodepng::encode(png_buf, img_buf.data(), width, height, LCT_GREY, 2);

    // Table row
    w <<
      u8"<tr>" <<
        u8"<td>" << mon_num <<
        u8"<td lang=ja>" << decode_text {mon_name} <<
        (en_mon_name ? "<td>" : "") << en_name_printer <<
        u8"<td>" << mon_lvl <<
        u8"<td>" << mon_hp <<
        u8"<td>" << mon_mp <<
        u8"<td>" << mon_tribe <<
        u8"<td><img src='data:image/png;base64," <<
          base64_encode {png_buf} <<
        u8"'>\n";
  }

  w << u8"</table>\n";
}

auto write_html(
  span<const u8> rom,
  optional<span<const u8>> en_rom = {}
) -> std::string {
  std::ostringstream w;

  w <<
    u8"<!doctype html>\n"
      "<html lang=en>\n"
      "<meta charset=utf-8>\n"
      "<title>女神転生外伝 Last Bible Monster Table</title>\n"
      "<style>"
      "img {"
      "image-rendering: -moz-crisp-edges;"
      "image-rendering: -webkit-crisp-edges;"
      "image-rendering: pixelated;"
      "image-rendering: crisp-edges;"
      "}"
      "</style>\n"
      "\n";
  mon_table(w, rom, en_rom);
  w <<
    u8"<p>(The garbage data in the last four rows is because there are "
      "only 109 monsters but there are 113 monster graphics.)\n"
      "</html>\n";

  return w.str();

}

auto main(int argc, zstring* argv) -> int {
  if (!(argc == 3 || argc == 4)) {
    fputs("Usage: montable /path/to/rom.gb [/path/to/english/rom.gb] out.html\n", stderr);
    return 1;
  }

  auto rom_path = argv[1];
  auto en_rom_path = argc == 3 ? optional<zstring>() : optional<zstring>(argv[2]);
  auto out_path = argc == 3 ? argv[2] : argv[3];

  auto rom = fileio::read_file(rom_path);
  auto en_rom = map_opt(en_rom_path, [](zstring path) {
    return fileio::read_file(path);
  });

  auto html = write_html(rom, en_rom);

  fileio::write_file(out_path, html);
}
