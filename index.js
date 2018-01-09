
const R = require('ramda');
const fs = require('mz/fs');
const argv = require('yargs').argv;
const mkdirp = require('mkdirp');
const path = require('path');
require('dot-into').install();


const log = R.tap(console.log);
const readFile = filename => fs.readFile(filename, { encoding: 'utf8' });
const writeFile = (filename, data) => fs.writeFile(filename, data, { encoding: 'utf8' });
const whenAll = Promise.all.bind(Promise);

const timedLineRE = /^(Dialogue: \d,(\d:\d\d:\d\d\.\d\d),(\d:\d\d:\d\d\.\d\d),Default,,\d,\d,\d,,)(.*)$/;
const isTimedLine = R.test(timedLineRE);
const toTimes = subtitle =>
	subtitle.split('\n')
	.filter(isTimedLine)
	.map(line => ({
		start: line.replace(timedLineRE, '$2'),
		end:   line.replace(timedLineRE, '$3'),
	}));
const getLanguage = R.pipe(path.basename, R.replace(/^(.+)\.txt$/, '$1'));
const splitLines = script => script.split(/\n(?!  )/).map(R.trim);

const processLineASS = line => line.replace(/\n  /g, '\\N');
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
	`${ time.start }0 --> ${ time.end }0\n` +
	processLineVTT(line) + '\n';
const rubyRE = /(?:｜)?([^｜]+)《(.+)》/g;
const processLineVTT = line => line.replace(rubyRE, '<ruby>$1<rt>$2</rt></ruby>');


(async () => {

	const timed = await readFile(argv.times);
	const times = toTimes(timed);
	const scriptFilenames = argv._;
	const scripts =
		await scriptFilenames
		.map(async filename => [getLanguage(filename), splitLines(await readFile(filename))])
		.into(whenAll)
		.then(R.fromPairs);
	const assSubtitles = scripts
		.into(R.map(R.map(processLineASS)))
		.into(R.map(replaceLines(timed)));
	const vttSubtitles = scripts
		.into(R.map(toVTT(times)));

	mkdirp.sync(argv.out + '/ass/');
	mkdirp.sync(argv.out + '/vtt/');
	assSubtitles.into(R.forEachObjIndexed((ass, lang) => writeFile(`${ argv.out }/ass/${ lang }.ass`, ass)));
	vttSubtitles.into(R.forEachObjIndexed((vtt, lang) => writeFile(`${ argv.out }/vtt/${ lang }.vtt`, vtt)));

})();

