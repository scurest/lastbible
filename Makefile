CXX=clang++
CXXFLAGS=--std=c++14 -Wall -Wextra

all: worldmap montable

worldmap: lodepng.o worldmap.cxx
	$(CXX) $(CXXFLAGS) lodepng.o worldmap.cxx -o worldmap

montable: lodepng.o montable.cxx
	$(CXX) $(CXXFLAGS) lodepng.o montable.cxx -o montable

lodepng.o: lodepng.cpp
	$(CXX) $(CXXFLAGS) -c lodepng.cpp

clean:
	rm *.o worldmap montable
