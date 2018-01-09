
Ferail
======

[![Build Status](https://travis-ci.org/agj/ferail.svg?branch=master)](https://travis-ci.org/agj/ferail)
[![Dependency Status](https://david-dm.org/agj/ferail.svg)](https://david-dm.org/agj/ferail)

A command-line tool that's useful for dividing the timing and the editing or translating of subtitle files. One .ass formatted file provides the timings, and any number of line-break separated plain-text scripts. Outputs [Advanced SubStation Alpha][ass] (.ass) and [WebVTT][vtt] (.vtt) formats.

Requires [Node][node].

[node]: https://nodejs.org/
[vtt]: https://en.wikipedia.org/wiki/WebVTT
[ass]: https://en.wikipedia.org/wiki/SubStation_Alpha#Advanced_SubStation_Alpha


## Example

Take this .ass subtitle (only showing the relevant bit)

```
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:03.54,0:00:05.34,Default,,0,0,0,,This is the first line
Dialogue: 0,0:00:08.58,0:00:13.74,Default,,0,0,0,,This is the second line
```

And this script

```
Oh dear
What should I do?
```

The output will be

```
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:03.54,0:00:05.34,Default,,0,0,0,,Oh dear
Dialogue: 0,0:00:08.58,0:00:13.74,Default,,0,0,0,,What should I do?
```

```
WEBVTT

0:00:03.540 --> 0:00:05.340
Oh dear

0:00:08.580 --> 0:00:13.740
What should I do?
```


## Installation

Using [Node][node], type into the command line:

```sh
npm install -g ferail
```

This will install the package globally, so you can access it anywhere.


## Usage

```sh
ferail --times timed-subtitle.ass scripts/*.txt
```

The above command, given the following directory structure

```
timed-subtitle.ass
scripts/
  English.txt
  Japanese.txt
  Spanish.txt
```

Will save the following files in this structure

```
output/
  vtt/
    English.vtt
    Japanese.vtt
    Spanish.vtt
  ass/
    English.ass
    Japanese.ass
    Spanish.ass
```

The `output` folder is the default, but the location can be changed by specifying the  `--output <output-folder>` option.

