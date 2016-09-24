CXX=c++
CXXFLAGS=--std=c++14 -Wall -Wextra

all: worldmap montable

worldmap: common.hxx lodepng.o worldmap.cxx
	$(CXX) $(CXXFLAGS) lodepng.o worldmap.cxx -o worldmap

montable: common.hxx lodepng.o montable.cxx
	$(CXX) $(CXXFLAGS) lodepng.o montable.cxx -o montable

lodepng.o: lodepng.cpp
	$(CXX) $(CXXFLAGS) -c lodepng.cpp

clean:
	rm *.o worldmap montable
