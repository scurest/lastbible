#pragma once
#include "span.hxx"
#include "vec2d.hxx"

/// lodepng wants 2-bit images packed into bytes (ie. with four pixels in one byte).
/// But we draw with one-pixel-one-byte (for simplicity). This function packs an image
/// into the format for PNG. The image is consumed and its buffer is reused for the
/// result.
auto pack_2bit_buffer(vec_2d<u8>&& im) -> std::vector<u8> {
  usize w = im.width;
  std::vector<u8> v(std::move(im.vec));
  const_span<u8> src = v;
  usize tgt = 0;

  while (src.size() != 0) {
    auto scanline = src.slice(0, w);

    auto s = scanline;
    while (s.size() >= 4) {
      v[tgt++] = (s[0] << 6) | (s[1] << 4) | (s[2] << 2) | s[3];
      s = s.slice_to_end(4);
    }
    auto b = 0u;
    switch (s.size()) {
      case 3: b |= s[2] << 2;
      case 2: b |= s[1] << 4;
      case 1: b |= s[0] << 6;
        v[tgt++] = u8(b);
    }

    src = src.slice_to_end(w);
  }

  v.resize(tgt);
  return v;
}
