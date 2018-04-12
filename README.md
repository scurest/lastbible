![女神転生外伝 Last Bible ラストバイブル ©1992 Atlus](http://scurest.github.io/lastbible/ss.png)

[World Map](http://scurest.github.io/lastbible/worldmap.png)  
[Monster Table](http://scurest.github.io/lastbible/montable.html)

------

Some quick code to dump data from [_女神転生外伝 Last Bible_](https://en.wikipedia.org/wiki/Megami_Tensei_Gaiden:_Last_Bible).

* `montable rom.gb [en_rom.gbc] out.html`

    Dumps an HTML table containing monster data.

    If the Game Boy Color translation is provided, the table
    will also contain English names.

* `worldmap rom.gb out.png`

    Dumps the world map.


## Building

On *nix

    $ git clone https://github.com/scurest/lastbible.git
    $ cd lastbible
    $ git submodule update --init --recursive
    $ mkdir build && cd build
    $ cmake ..
    $ make

## ROM Info

* _女神転生外伝 Last Bible_ (Atlus, 1992, Game Boy)
    * SHA1: 537b38234da5164335e98f6aee3b792048624626
* _Revelations: The Demon Slayer_ (Atlus, 1999, Game Boy Color)
    * SHA1: bd684074944ccc02b5f997e7ab95d0b03327773d

------
------

Special thanks to bircd.org's [bgb](http://bgb.bircd.org/)!\
Special thanks to @raekuul for reverse engineering work!
