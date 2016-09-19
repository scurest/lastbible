#include "common.hxx"
#include "lodepng.h"

// The table of monster data is located at mons_off. The entries look like
//   mon {
//     name: u8[7],
//     ...
//   }
// Total size of an entry: 32
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

void draw_tiles_to_rect(const_span<u8> tiles, span_2d<u8> rect) {
  auto width_in_tiles = rect.width / 8;
  auto height_in_tiles = rect.heigth / 8;
  auto num_tiles = width_in_tiles * height_in_tiles;
  const_chunks<u8> tile_chunks { tiles.begin(), num_tiles, 16 };

  usize idx = 0;
  for (usize y = 0; y != height_in_tiles; ++y) {
    for (usize x = 0; x != width_in_tiles; ++x) {
      auto tile = tile_chunks[idx++];
      draw_tile(tile, rect.subrect(8*x, 8*y, 8, 8));
    }
  }
}

void mon_graphic(const_span<u8> rom, const_span<u8> entry, vec_2d<u8>& buf) {
  auto b0 = entry[0];
  auto height = (b0 & 0xf0) >> 4;
  auto width = b0 & 0x0f;
  auto page = entry[1];
  u16 addr = u16(entry[2]) + (u16(entry[3]) << 8);

  auto off = page_addr(page, addr);
  auto tiles = rom.slice(off, off + 16*width*height);
  buf.resize(8*width, 8*height);
  draw_tiles_to_rect(tiles, buf);
}

void mon_table(utf8_str& out, const_span<u8> rom, const_span<u8> en_rom = {}) {
  const_chunks<u8> mons { rom.begin() + mons_off, num_mons, 32 };
  const_chunks<u8> mon_gfxs { rom.begin() + mon_gfxs_off, num_mons, 4 };
  const_chunks<u8> en_mons;
  if (en_rom) {
    en_mons = const_chunks<u8> { en_rom.begin() + en_mons_off, num_mons, 32 };
  }

  std::vector<u8> img_buf;
  std::vector<u8> png_buf;

  auto outi = std::back_inserter(out);

  out.append(u8"<table border=1>\n"
               "<tr><th>No.<th lang=ja>名前");
  if (en_rom) {
    out.append(u8"<th>Name");
  }
  out.append(u8"<th>\n");

  for (usize i = 0; i != num_mons; ++i) {
    auto mon = mons[i];
    auto gfx = mon_gfxs[i];

    vec_2d<u8> img { std::move(img_buf), 0, 0 };
    mon_graphic(rom, gfx, img);
    auto w = img.width;
    auto h = img.height;
    img_buf = pack_2bit_buffer(std::move(img));
    png_buf.clear();
    lodepng::encode(png_buf, img_buf.data(), w, h, LCT_GREY, 2);

    out.append(u8"<tr><td>");
    print(outi, i + 1);
    out.append(u8"<td lang=ja>");
    decode_text(outi, mon.slice(0, 7));
    if (en_rom) {
      auto en_mon = en_mons[i];
      out.append(u8"<td>");
      decode_en_text_escape_html(outi, en_mon.slice(0, 7));
    }
    out.append(u8"<td><img src='data:image/png;base64,");
    base64_encode(outi, png_buf);
    out.append(u8"'>\n");
  }

  out.append(u8"</table>\n");
}

int main(int argc, char** argv) {
  if (argc != 3 && argc != 4) {
    fputs("Usage: montable /path/to/rom.gb [/path/to/english/rom.gb] out.html\n", stderr);
    return 1;
  }

  auto rom_path = argv[1];
  auto en_rom_path = argc == 3 ? nullptr : argv[2];
  auto out_path = argc == 3 ? argv[2] : argv[3];

  auto rom = read_file(rom_path);
  utf8_str s;
  s.append(u8"<!doctype html>\n"
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
             "\n");
  if (!en_rom_path) {
    mon_table(s, rom);
  }
  else {
    auto en_rom = read_file(en_rom_path);
    mon_table(s, rom, en_rom);
  }
  s.append(u8"<p>(The garbage data in the last four rows is because there are only 109 "
             "monsters but there are 113 monster graphics.)\n"
             "</html>\n");
  write_file(out_path, s);
}
