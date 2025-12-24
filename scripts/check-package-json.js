const fs = require('node:fs');
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
