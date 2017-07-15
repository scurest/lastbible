#pragma once
#include <type_traits>
#include <vector>
#include "types.hxx"

/// A view onto a section of an array.
template <class T>
struct span {
  constexpr span(T* b, T* e) : begin_(b), end_(e) {}

  using nonconst_T = std::remove_const_t<T>;
  span(std::vector<nonconst_T>& v) : span(v.data(), v.data() + v.size()) {}
  span(const std::vector<nonconst_T>& v) : span(v.data(), v.data() + v.size()) {}

  constexpr auto begin() const -> T* { return begin_; }
  constexpr auto end() const -> T* { return end_; }

  constexpr auto size() -> usize { return end_ - begin_; }

  constexpr auto operator[](usize pos) const -> T& {
    return begin_[pos];
  }

  constexpr auto slice(usize l, usize r) const -> span<T> {
    return { begin_ + l, begin_ + r };
  }
  constexpr auto slice_len(usize off, usize len) const -> span<T> {
    return slice(off, off + len);
  }
  constexpr auto slice_to_end(usize off) const -> span<T> {
    return { begin_ + off, end_ };
  }

  constexpr operator span<const T>() const { return { begin_, end_ }; }

private:
  T* begin_;
  T* end_;
};
