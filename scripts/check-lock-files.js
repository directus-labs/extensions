const fs = require('node:fs');
const process = require('node:process');

console.log(`Checking ${process.cwd()}`);

if (fs.existsSync('./package-lock.json')) {
	console.error(
		'package-lock.json is unecessary due to pnpm workspace, please remove',
	);

	process.exit(1);
}

if (fs.existsSync('./pnpm-lock.yaml')) {
	console.error(
		'pnpm-lock.yaml is unecessary due to pnpm workspace, please remove',
	);

	process.exit(1);
}
