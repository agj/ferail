

import R from 'ramda';
import fs from 'fs-promise';
import glob from 'glob-promise';
import longjohn from 'longjohn';
import dotInto from 'dot-into';

dotInto.install();


Promise.all([
	fs.readFile('input/times/timed.ass', { encoding: 'utf8' }),
	glob('input/text/*.txt')
		.then(R.map(filename => Promise.all([
			R.replace(/input\/text\/(.+)\.txt/, '$1', filename),
			fs.readFile(filename, { encoding: 'utf8' })
		])))
		.then(Promise.all.bind(Promise))
])
.then(([times, texts]) => texts.map(([lang, text]) => [lang, timeText(text, times)]))
.then(R.map(([lang, subs]) => fs.writeFile('output/' + lang + '.ass', subs, { encoding: 'utf8' })))
.then(Promise.all.bind(Promise))
.then(R.always('Finished!'))
.then(console.log)
.catch(e => console.log(e.stack));

const re = /^(Dialogue: \d,\d:\d\d:\d\d\.\d\d,\d:\d\d:\d\d\.\d\d,Default,,\d,\d,\d,,)(.*)$/;
const timeText = (text, times) =>
	R.reduce(
		([result, lines], timed) =>
			R.test(re, timed)
			? [R.append(R.replace(re, '$1' + R.head(lines), timed), result),
			   R.tail(lines)]
			: [R.append(timed, result),
			   lines],
		[[], text.split('\n')],
		times.split('\n')
	)
	.into(R.nth(0))
	.join('\n');

