
const R = require('ramda');
const fs = require('fs-promise');
const glob = require('glob-promise');
const xre = require('xregexp');
require('dot-into').install();

const log = R.tap(console.log);
const whenAll = Promise.all.bind(Promise);
const readFile = filename => fs.readFile(filename, { encoding: 'utf8' });
const writeFile = (filename, data) => fs.writeFile(filename, data, { encoding: 'utf8' });
const getLanguage = R.replace(/input\/text\/(.+)\.txt/, '$1');
const timedLineRE = /^(Dialogue: \d,(\d:\d\d:\d\d\.\d\d),(\d:\d\d:\d\d\.\d\d),Default,,\d,\d,\d,,)(.*)$/;
const isTimedLine = R.test(timedLineRE);
const toTimes = subtitle =>
	subtitle.split('\n')
	.filter(isTimedLine)
	.map(line => ({
		start: line.replace(timedLineRE, '$2'),
		end:   line.replace(timedLineRE, '$3'),
	}));
const replaceLines = R.curry((sub, lines) =>
	R.reduce(
		([result, remaining], subLine) =>
			isTimedLine(subLine)
			? [R.append(subLine.replace(timedLineRE, '$1' + R.head(remaining)), result),
			   R.tail(remaining)]
			: [R.append(subLine, result),
			   remaining],
		[[], lines],
		sub.split('\n')
	)
	.into(R.head)
	.join('\n')
);
const toVTT = R.curry((times, lines) =>
	R.zip(times, lines)
	.map(([time, line]) => formatVTTLine(time, line))
	.join('\n')
	.into(sub => 'WEBVTT\n\n' + sub)
);
const formatVTTLine = (time, line) =>
	`${ time.start } --> ${ time.end }\n` +
	processLineVTT(line) + '\n';
const splitLines = script => script.split(/\n(?!  )/).map(R.trim);
const processLineASS = line => line.replace(/\n  /g, '\\N');
const rubyRE = xre('(?:｜)?([^｜]+)《(.+)》', 'g');
const processLineVTT = line => line.replace(rubyRE, '<ruby>$1<rt>$2</rt></ruby>');


(async () => {
	const timed = await readFile('input/times/timed.ass');
	const times = toTimes(timed);
	const scriptFilenames = await glob('input/text/*.txt');
	const scripts = (
			await scriptFilenames
			.map(async filename => [getLanguage(filename), splitLines(await readFile(filename))])
			.into(whenAll)
		)
		.into(R.fromPairs);
	const assSubtitles = scripts
		.into(R.map(R.map(processLineASS)))
		.into(R.map(replaceLines(timed)));
	const vttSubtitles = scripts
		.into(R.map(toVTT(times)));

	assSubtitles.into(R.forEachObjIndexed((ass, lang) => writeFile(`output/ass/${ lang }.ass`, ass)));
	vttSubtitles.into(R.forEachObjIndexed((vtt, lang) => writeFile(`output/vtt/${ lang }.vtt`, vtt)));
})();

