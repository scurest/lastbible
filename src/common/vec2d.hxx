#pragma once
#include <vector>
#include <utility>
#include "types.hxx"

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
  vec_2d(usize w, usize h) : vec(w*h), w_(w), h_(h) {}
  vec_2d(std::vector<T> v, usize w, usize h) : vec(std::move(v)) {
    resize(w, h);
  }
  void resize(usize w, usize h) {
    vec.resize(w*h);
    w_ = w;
    h_ = h;
  }

  auto width() const -> usize { return w_; }
  auto height() const -> usize { return h_; }

  auto data() & -> std::vector<T>& { return vec; }
  auto data() const& -> const std::vector<T>& { return vec; }
  auto data() && -> std::vector<T>&& { return std::move(vec); }

  operator span_2d<T>() { return { vec.data(), width(), width(), height() }; }
  operator span_2d<const T>() const { return { vec.data(), width(), width(), height() }; }

private:
  std::vector<T> vec;
  usize w_;
  usize h_;
};
