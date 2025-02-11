const fs = require('node:fs');
const { formatTitle } = require('@directus/format-title');
const Mustache = require('mustache');

const metaData = JSON.parse(fs.readFileSync(`./package.json`))['directus:meta'];

/* Update the packages */
const packages = fs.readdirSync('./packages');

function removePrefix(name) {
	if (name.startsWith('@')) {
		name = name.split('/')[1];
	}

	if (name.startsWith('directus-extension-')) {
		name = name.substring('directus-extension-'.length);
	}

	return name;
}

const formattedPackages = packages.map((packageDir) => {
	const packageJson = JSON.parse(fs.readFileSync(`./packages/${packageDir}/package.json`));
	return {
		name: formatTitle(removePrefix(packageJson.name)),
		type: formatTitle(packageJson['directus:extension'].type),
		sandboxed: (packageJson['directus:extension'].sandbox ? '✅' : 'N/A'),
		maintained: (metaData.maintained.includes(packageDir) ? '⭐' : ''),
		directory: packageDir,
	};
});

const readmeTemplate = fs.readFileSync('scripts/templates/readme.md. mustache').toString();
const readmeOutput = Mustache.render(readmeTemplate, { extensions: formattedPackages });

fs.writeFileSync('./readme.md', readmeOutput);
