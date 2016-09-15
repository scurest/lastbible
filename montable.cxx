#include "common.hxx"

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
constexpr usize mon_gfxs_off = 0x14d45;
constexpr usize num_mons = 113;

void draw_tiles_to_rect(span<u8> tiles, span_2d<u8> rect) {
  auto width_in_tiles = rect.width / 8;
  auto height_in_tiles = rect.height / 8;
  auto num_tiles = width_in_tiles * height_in_tiles;
  auto tile_chunks = chunks { tiles.begin(), num_tiles, 16 };

  usize idx = 0;
  for (usize y = 0; y != height_in_tiles; ++y) {
    for (usize x = 0; x != width_in_tiles; ++x) {
      auto tile = tile_chunks[idx++];
      draw_tile(tile, rect.subrect(8*x, 8*y, 8, 8));
    }
  }
}

void mon_graphic(span<u8> rom, span<u8> entry, vec_2d<u8>& buf) {
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

void mon_table(utf8_str& out, span<u8> rom) {
  auto mons = chunks { rom.begin() + mons_off, num_mons, 32 };
  auto mon_gfxs = chunks { rom.begin() + mon_gfxs_off, num_mons, 4 };

  std::vector<u8> img_buf;
  std::vector<u8> png_buf;

  auto outi = std::back_inserter(out);

  out.append(u8"<table border=1>\n"
               "<tr><th>No.<th lang=ja>名前<th>\n");

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
    out.append(u8"</td><td lang=ja>");
    decode_text(outi, mon.slice(0, 7));
    out.append(u8"</td><td><img src='data:image/png;base64,");
    base64_encode(outi, png_buf);
    out.append(u8"'>\n");
  }

  out.append(u8"</table>\n");
}

int main(int argc, char** v) {
  if (argc != 3) {
    fputs("Usage: worldmap path/to/rom.gb output.png\n", stderr);
    return 1;
  }

  auto rom = read_entire_file(v[1]);
  utf8_str s;
  s.append(u8"<!doctype html>\n"
             "<html lang=en>\n"
             "<head>\n"
             "<meta charset=utf-8>\n"
             "<style>"
             "img {"
             "image-rendering: -moz-crisp-edges;"
             "image-rendering: -webkit-crisp-edges;"
             "image-rendering: pixelated;"
             "image-rendering: crisp-edges;"
             "}</style>\n"
             "</head>\n"
             "<body>\n");
  mon_table(s, rom);
  s.append(u8"<p>(The garbage data in the last four rows is because there are only 109 "
             "monsters but there are 113 monster graphics.)</p>\n"
             "</body>\n"
             "</html>\n");
  write_file(v[2], s);
}
