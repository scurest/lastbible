#pragma once
#include "int.hxx"
#include "span.hxx"

/// Views an array as a sequence of len chunks, each of chunk_size elements.
template <class T>
struct chunks {
  T* start;
  usize num_chunks;
  usize chunk_size;

  constexpr chunks() : start(nullptr), num_chunks(0), chunk_size(0) {}
  constexpr chunks(T* s, usize n, usize c) : start(s), num_chunks(n), chunk_size(c) {}

  constexpr auto operator[](usize pos) const -> span<T> {
    auto begin = start + chunk_size * pos;
    auto end = begin + chunk_size;
    return { begin, end };
  }
};
template <class T> using const_chunks = chunks<const T>;
