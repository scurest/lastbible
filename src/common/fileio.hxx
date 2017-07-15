#pragma once
#include <cstdio>
#include <string_view>
#include <vector>
#include "span.hxx"
#include "types.hxx"

namespace fileio {

struct couldnt_open_file {};
struct couldnt_seek_in_file {};
struct couldnt_read_file {};
struct couldnt_write_file {};

inline auto read_file(czstring filename) -> std::vector<u8> {
  auto f = fopen(filename, "rb");
  if (!f) throw couldnt_open_file {};

  if (fseek(f, 0, SEEK_END) == -1) throw couldnt_seek_in_file {};
  auto len = ftell(f);
  if (len == -1) throw couldnt_seek_in_file {};
  if (fseek(f, 0, SEEK_SET) == -1) throw couldnt_seek_in_file {};

  try {
    std::vector<u8> out(len);
    if (fread(out.data(), len, 1, f) == 0) throw couldnt_read_file {};
    fclose(f);
    return out;
  } catch(...) {
    fclose(f);
    throw;
  }
}

inline void write_file(czstring filename, span<const u8> bytes) {
  auto f = fopen(filename, "wb");
  if (!f) throw couldnt_open_file {};
  auto result = fwrite(bytes.begin(), bytes.size(), 1, f);
  fclose(f);
  if (result == 0) throw couldnt_write_file {};
}

inline void write_file(czstring filename, const std::string_view str) {
  using u8_ptr = const u8*;
  auto begin = u8_ptr(str.data());
  auto size = str.size();
  write_file(filename, span<const u8>(begin, begin + size));
}

}
