#pragma once
#include "int.hxx"
#include "span.hxx"

/// Views an array as a sequence of len chunks, each of chunk_size elements.
template <class T>
struct chunks {
  constexpr chunks(T* s, usize n, usize c) : start(s), num_chunks(n), chunk_size(c) {}

  constexpr auto operator[](usize pos) const -> span<T> {
    auto begin = start + chunk_size * pos;
    auto end = begin + chunk_size;
    return { begin, end };
  }

private:
  T* start;
  usize num_chunks;
  usize chunk_size;
};
