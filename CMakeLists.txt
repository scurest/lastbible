cmake_minimum_required(VERSION 3.4)
project(LastBible LANGUAGES CXX)

add_library(lodepng
    external/lodepng/lodepng.cpp)

# montable
add_executable(montable
    src/montable.cxx)
set_target_properties(montable PROPERTIES CXX_STANDARD 17)
target_include_directories(montable PRIVATE external/)
target_link_libraries(montable PRIVATE lodepng)

# worldmap
add_executable(worldmap
    src/worldmap.cxx)
set_target_properties(worldmap PROPERTIES CXX_STANDARD 17)
target_include_directories(worldmap PRIVATE external/)
target_link_libraries(worldmap PRIVATE lodepng)
