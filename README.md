![女神転生外伝 Last Bible ラストバイブル ©1992 Atlus](http://scurest.github.io/lastbible/ss.png)

[World Map](http://scurest.github.io/lastbible/worldmap.png)  
[Monster Table](http://scurest.github.io/lastbible/montable.html)

------

Some quick code to dump data from _女神転生外伝 Last Bible_ (Atlus, 1992, Game Boy). Presently
dumps a list of monster names and graphics, and the worldmap. Written in C++14 +
`experimental/optional`.

To build on *nix:

    $ git clone https://github.com/scurest/lastbible.git
    $ cd lastbible
    $ mkdir build
    $ cd build
    $ cmake .. && make

The ROM file used by all the programs is the Japanese version for the original Game Boy
(SHA1: `537b38234da5164335e98f6aee3b792048624626`). The English ROM optionally used by
`montable` is the English translation of the Game Boy Color port, _Revelations: The Demon
 Slayer_ (SHA1: `bd684074944ccc02b5f997e7ab95d0b03327773d`).

Special thanks to bircd.org's [bgb](http://bgb.bircd.org/).
