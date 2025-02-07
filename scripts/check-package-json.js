const fs = require('node:fs');
const process = require('node:process');

const { name } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (!name.startsWith('@directus-labs/')) {
	console.error('Not part of @directus-labs npm org');
	process.exit(1);
}
