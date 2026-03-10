const fs = require('node:fs');
const { formatTitle } = require('@directus/format-title');
const Mustache = require('mustache');

/* Update the packages */
const packages = fs.readdirSync('./packages');

function removePrefix(name) {
	if (name.startsWith('@')) {
		name = name.split('/')[1];
	}

	if (name.startsWith('directus-extension-')) {
		name = name.slice('directus-extension-'.length);
	}

	return name;
}

const formattedPackages = packages.map((packageDir) => {
	const packageJson = JSON.parse(fs.readFileSync(`./packages/${packageDir}/package.json`));
	return {
		name: formatTitle(removePrefix(packageJson.name)),
		type: formatTitle(packageJson['directus:extension'].type),
		sandboxed: (packageJson['directus:extension'].sandbox ? '✅' : 'N/A'),
		directory: packageDir,
	};
});

// README
const readmeTemplate = fs.readFileSync('scripts/templates/readme.md.mustache').toString();
const readmeOutput = Mustache.render(readmeTemplate, { extensions: formattedPackages });

fs.writeFileSync('./readme.md', readmeOutput);

// Bug Report
const bugReportTemplate = fs.readFileSync('scripts/templates/bug-report.yml.mustache').toString();
const bugReportOutput = Mustache.render(bugReportTemplate, { extensions: formattedPackages });

fs.writeFileSync('.github/ISSUE_TEMPLATE/bug-report.yml', bugReportOutput);

// Enhancement
const enhancementTemplate = fs.readFileSync('scripts/templates/enhancement.yml.mustache').toString();
const enhancementOutput = Mustache.render(enhancementTemplate, { extensions: formattedPackages });

fs.writeFileSync('.github/ISSUE_TEMPLATE/enhancement.yml', enhancementOutput);
