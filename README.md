# renamer

A small command line tool for renaming many files at once. No dependencies,
needs Node 18 or newer.

    node bin/renamer.js IMG_ photo_ IMG_0001.jpg IMG_0002.jpg

This first version replaces every occurrence of one string with another in
the names of the files you list, and renames them straight away.
