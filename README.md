![女神転生外伝 Last Bible ラストバイブル ©1992 Atlus](http://scurest.github.io/lastbible/ss.png)

[World Map](http://scurest.github.io/lastbible/worldmap.png)  
[Monster Table](http://scurest.github.io/lastbible/montable.html)

------

Some quick code to dump data from _女神転生外伝 Last Bible_ (Atlus, 1992, Game Boy). Presently dumps a list of monster names and graphics, and the worldmap. Written in C++14.

To build on *nix:

    $ git clone https://github.com/scurest/lastbible.git
    $ cd lastbible
    $ make

Note that the ROM file you need to supply is the Japanese version for the original Game Boy (SHA1: `537b38234da5164335e98f6aee3b792048624626`), not the English translation (_Revelations: The Demon Slayer_) of the Game Boy Color port.

Special thanks to bircd.org's [bgb](http://bgb.bircd.org/).
