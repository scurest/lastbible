cmake_minimum_required(VERSION 3.4)
project(LastBible LANGUAGES CXX)

add_library(lodepng
    vendor/lodepng/lodepng.cpp) 

add_executable(montable
    src/montable.cxx)
add_executable(worldmap
    src/worldmap.cxx)

target_include_directories(montable PRIVATE vendor/)
target_include_directories(worldmap PRIVATE vendor/)

target_link_libraries(montable PRIVATE lodepng)
target_link_libraries(worldmap PRIVATE lodepng)

set_target_properties(
    montable worldmap
    PROPERTIES CXX_STANDARD 14)
