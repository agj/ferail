

const R = require('ramda');
const fs = require('fs-promise');
const glob = require('glob-promise');
const assParser = require('ass-parser');
const assStringify = require('ass-parser');
require('dot-into').install();

const whenAll = Promise.all.bind(Promise);
const whenAllObj = obj =>
	Object.keys(obj)
	.into(R.reduce((acc, prop) => whenAll([acc, obj[prop]]).then(([accResult, thisResult]) => {
		accResult[prop] = thisResult;
		return accResult;
	}), Promise.resolve({})));
const getLanguage = R.replace(/input\/text\/(.+)\.txt/, '$1');
const readFile = filename => fs.readFile(filename, { encoding: 'utf8' });
const writeFile = (filename, data) => fs.writeFile(filename, data, { encoding: 'utf8' });

const getScripts = scriptsGlob =>
	glob(scriptsGlob)
	.then(R.map(filename => ({ language: getLanguage(filename), script: readFile(filename).then(R.split('\n')) })))
	.then(R.map(whenAllObj))
	.then(whenAll);
const getTimeScripts = (timedFilename, scriptsGlob) =>
	readFile(timedFilename)
	.then(assParser)
	.then(timed =>
		getScripts(scriptsGlob)
		.then(R.map(script => ({ timed: timed, script: script.script, language: script.language })))
	);
const isSectionEvents = R.propEq('section', 'Events');
R.propEq('key', 'Dialogue')
const applyTimes = ({ language, timed, script }) =>
	({ language: language, subtitle:
		timed.map(R.when(isSectionEvents, evts =>
			R.merge(evts, { body:
				evts.body
			})
		))
		// R.merge(timed, { events:
		// 	R.zip(timed, script)
		// 	.into(R.map(R.apply((ev, line) => R.merge(ev, { text: line }))))
		// })
	});


// const getFilePairs = (timedFilename, scriptsGlob) =>
// 	[
// 		readFile(timedFilename),
// 		glob(scriptsGlob)
// 			.then(R.map(filename => [getLanguage(filename), readFile(filename)]))
// 			.then(R.map(whenAll))
// 			.then(whenAll)
// 	]
// 	.into(whenAll);

// const re = /^(Dialogue: \d,\d:\d\d:\d\d\.\d\d,\d:\d\d:\d\d\.\d\d,Default,,\d,\d,\d,,)(.*)$/;
// const timeText = (text, times) =>
// 	R.reduce(
// 		([result, lines], timed) =>
// 			R.test(re, timed)
// 			? [R.append(R.replace(re, '$1' + R.head(lines), timed), result),
// 			   R.tail(lines)]
// 			: [R.append(timed, result),
// 			   lines],
// 		[[], text.split('\n')],
// 		times.split('\n')
// 	)
// 	.into(R.nth(0))
// 	.join('\n');


getTimeScripts('input/times/timed.ass', 'input/text/*.txt')
.then(R.map(applyTimes))
.then(R.map(sub => writeFile(`output/${ sub.language }.ass`, ass.Script.prototype.toAss.call(sub.subtitle))))

// .then(([times, texts]) => texts.map(([lang, text]) => [lang, timeText(text, times)]))
// .then(R.map(([lang, subs]) => fs.writeFile('output/' + lang + '.ass', subs, { encoding: 'utf8' })))
// .then(Promise.all.bind(Promise))
// .then(R.always('Finished!'))

// .then(console.log)
.catch(e => console.log(e.stack));

