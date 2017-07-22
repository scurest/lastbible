#pragma once
#include <experimental/optional>
#include <ostream>
#include <utility>

template <class T>
using optional = std::experimental::optional<T>;

template <class Opt, class F>
auto map_opt(Opt&& opt, F f) -> optional<decltype(f(*std::forward<Opt>(opt)))> {
  if (!opt) return {};
  return f(*std::forward<Opt>(opt));
}

template <class Opt>
struct maybe_printer {
  const Opt& opt;

  friend auto operator<<(
    std::ostream& os,
    const maybe_printer& m
  ) -> std::ostream& {
    if (m.opt) return os << *(m.opt);
    return os;
  }
};

/// `os << maybe_print(opt)` prints `opt`s contained values, if it has
/// one. Otherwise, it prints nothing.
template <class Opt>
auto maybe_print(const Opt& opt) -> maybe_printer<Opt> {
  return {opt};
}
