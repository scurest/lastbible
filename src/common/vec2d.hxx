#pragma once
#include <vector>
#include "int.hxx"

/// A view onto a rectangular region of a 2D array.
template <class T>
struct span_2d {
  T* begin;
  usize pitch;
  usize width;
  usize height;

  using index_type = std::pair<usize, usize>;

  constexpr auto operator[](index_type pos) const -> T& {
    return begin[pos.second*pitch + pos.first];
  }

  constexpr auto subrect(usize x, usize y, usize w, usize h) const -> span_2d<T> {
    auto new_begin = begin + y*pitch + x;
    return { new_begin, pitch, w, h };
  }

  constexpr operator span_2d<const T>() const { return { begin, pitch, width, height }; }
};

/// A vector that holds a 2D array.
template <class T>
struct vec_2d {
  std::vector<T> vec;
  usize width;
  usize height;

  vec_2d(usize w, usize h) : vec(w*h), width(w), height(h) {}
  vec_2d(std::vector<T> v, usize w, usize h) : vec(std::move(v)), width(w), height(h) {}
  void resize(usize w, usize h) {
    vec.resize(w*h);
    width = w;
    height = h;
  }

  operator span_2d<T>() { return { vec.data(), width, width, height }; }
  operator span_2d<const T>() const { return { vec.data(), width, width, height }; }
};
