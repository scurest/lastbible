#pragma once
#include <cstdio>
#include <string>
#include <vector>
#include "span.hxx"

inline auto read_file(const char* filename) -> std::vector<u8> {
  // I/O streams suck, so just do it the C way.
  auto f = fopen(filename, "rb");
  fseek(f, 0, SEEK_END);
  auto len = usize(ftell(f));
  rewind(f);
  std::vector<u8> out(len); // FIXME: don't leak f if this throws
  fread(out.data(), len, 1, f);
  fclose(f);
  return out;
}

inline void write_file(const char* filename, const_span<u8> bytes) {
  auto f = fopen(filename, "wb");
  fwrite(bytes.begin(), bytes.size(), 1, f);
  fclose(f);
}

inline void write_file(const char* filename, const std::string& str) {
  using u8_ptr = const u8*;
  auto begin = u8_ptr(str.data());
  auto end = begin + str.size();
  write_file(filename, const_span<u8>(begin, end));
}