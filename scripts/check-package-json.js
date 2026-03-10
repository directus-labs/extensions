const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const { name, repository } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (!name.startsWith('@directus-labs/')) {
	console.error('Not part of @directus-labs npm org');
	process.exit(1);
}

if (repository?.url !== 'https://github.com/directus-labs/extensions.git') {
	console.error('repository.url is not correct');
	process.exit(1);
}

const expectedDirectory = path.relative(path.join(__dirname, '..'), process.cwd());

if (repository?.directory !== expectedDirectory) {
	console.error(`Expected directory to be "${expectedDirectory}" instead of "${repository?.directory}"`);
	process.exit(1);
}
