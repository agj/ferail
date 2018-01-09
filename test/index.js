
const R = require('ramda');
const fs = require('mz/fs');
const mkdirp = require('mkdirp');
const exec = require('mz/child_process').exec;
const glob = require('glob-promise');
const rmrf = require('rimraf');
const C = require('chalk');
require('dot-into').install();


const log = R.tap(console.log);
const readFile = filename => fs.readFile(filename, { encoding: 'utf8' });
const whenAll = Promise.all.bind(Promise);

const inTempFolder = R.replace(/^expected/, 'temp');
const compare = ([a, b]) => a === b;


process.chdir(__dirname);

(async () => {

	rmrf.sync('temp/');
	await exec('node ../ --times input/timed.ass --out temp input/text/*.txt');

	const results = await glob('expected/**/*.{ass,vtt}')
		.then(R.map(async file => [await readFile(file), await readFile(inTempFolder(file))]))
		.then(whenAll)
		.then(R.map(compare));
	const allOK = results.every(R.identity);

	rmrf.sync('temp/');

	if (!allOK) {
		console.error(C.red("Output doesn't match expected result."));
		process.exit(1);
	}

	console.log(C.green("Output correctly matches results."));

})().catch(err => {
	console.error(err);
	process.exit(1);
});
