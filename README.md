# renamer

Rename many files at once, with a dry run, collision checks and an undo. No
dependencies; needs Node 18 or newer.

    renamer -n -f IMG_ -w holiday- *.jpg                 # preview
    renamer -f IMG_ -w holiday- *.jpg                    # do it
    renamer --slug *.JPG                                 # "My Photo (1).JPG" -> "my-photo-1.jpg"
    renamer -t '{n:3}_{name|slug}{ext}' --sort natural *.png
    renamer -R --include '*.jpeg' --ext jpg photos/
    renamer --undo

Run it as `node bin/renamer.js` from a checkout, or `npm link` to get `renamer`.

## What it does

Pick one way to produce new names, then optionally a case style and a new
extension. Names are worked out for the base name only; folders are never
renamed and files never move between folders.

| option | effect |
| --- | --- |
| `-f TEXT`, `-w TEXT` | replace TEXT with the `--with` text everywhere in the name |
| `-e`, `--flags F` | treat `--find` as a regular expression (`$1`, `$<name>`; default flag `g`) |
| `-t TEMPLATE` | build the name from parts, see below |
| `--lower`, `--upper`, `--title`, `--slug` | change the case of the name (`--slug` also removes accents and punctuation) |
| `--ext EXT` | set the extension (`--ext ""` removes it); `.tar.gz` counts as one extension |

### Templates

`{name}` the name without extension, `{ext}` the extension with its dot,
`{base}` the old name, `{parent}` the folder's name, `{n}` a counter
(`{n:3}` pads to three digits), `{mtime}` the modification date
(`{mtime:YYYYMMDD_HHmmss}` for another format; `--utc` for UTC). Add `|lower`,
`|upper`, `|title` or `|slug` to change the case of a field, and `{{` or `}}`
for literal braces. `--start N` and `--step N` (`--step=-1` to count down) set
the counter, and `--sort name|natural|mtime|size` with `--reverse` chooses the
order in which files are numbered.

## Safety

- Everything is checked before anything is renamed: missing files, two files
  getting the same name, and targets that already exist all stop the run
  (`--force` allows replacing files, never folders).
- Swaps and chains (`a -> b`, `b -> c`) work; files are parked under a
  temporary name when needed.
- Case-only renames work on case-insensitive file systems.
- Generated names are made valid on every platform: `/ \ : * ? " < > |` and
  control characters become `_`, trailing dots and spaces are dropped,
  reserved names such as `CON` get a leading `_`.
- After a real run the renames are saved to `.renamer-undo.json` in the
  current folder, and `renamer --undo` puts everything back (files replaced by
  `--force` cannot be restored).

## Folders and presets

`-R` renames the files below the folders you name, skipping dotfiles and dot
folders unless `--hidden` is given; `--max-depth N`, `--include GLOB` and
`--exclude GLOB` narrow it down. A preset in `.renamerrc.json` stores a set
of options:

    { "presets": { "photos": { "template": "{mtime:YYYYMMDD}_{n:3}{ext}", "sort": "mtime", "ext": "jpg" } } }

`renamer --preset photos *.JPG` applies it; options on the command line
override the preset.

Other flags: `--json` prints the plan as JSON, `--color` and `--no-color`
override the terminal detection (`NO_COLOR` is respected), `-n` is `--dry-run`.
Exit status: 0 done, 1 the checks failed and nothing was renamed, 2 bad
options.

## Development

    npm test

The tests use `node:test` and real temporary folders.
