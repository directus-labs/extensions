const fs = require('node:fs');
const process = require('node:process');

if (fs.readFileSync('./package-lock.json')) {
	console.error(
		'package-lock.json is unecessary due to pnpmi workspace, please remove',
	);

	process.exit(1);
}

if (fs.readFileSync('./pnpm-lock.yaml')) {
	console.error(
		'pnpm-lock.yaml is unecessary due to pnpmi workspace, please remove',
	);

	process.exit(1);
}
