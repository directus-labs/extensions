import fs from 'node:fs';
import process from 'node:process';
import { execa, execaSync } from 'execa';

const DIRECTUS_VERSION = process.argv.slice(2)[0] || 'latest';

const { name } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const packageName = name.split('/')[1];

console.log(`Checking package ${name}`);

async function dockerRemove(name) {
	console.log(`Stopping ${name}`);
	return await execaSync({ shell: true })`docker rm --force ${name}`;
}

async function dockerRun(image, name, path, version) {
	console.log(`Run ${image}`);

	const containerName = `${name}.${version}`;

	try {
		const readable = execa({ shell: true })`docker run --rm -v ./packages/${name}:${path} --name ${containerName} ${image}`.readable();

		let success = false;

		readable.on('data', async (data) => {
			if (data.toString().includes('App [directus:0] online')) {
				try {
					readable.destroy();
					console.log(`Run ${image} success`);
					success = true;
					await dockerRemove(containerName);
					process.exit(0);
				}
				catch (error) {
					readable.destroy();
					await dockerRemove(containerName);
					console.error(error);
				}
			}
		});

		setTimeout(async () => {
			if (!success) {
				console.error(`Run ${image} fail - timeout`);
				await dockerRemove(containerName);
				process.exit(1);
			}
		}, 30000);
	}
	catch (error) {
		console.error(error);
		await dockerRemove(containerName);
		process.exit(1);
	}
}

const image = `directus/directus:${DIRECTUS_VERSION}`;
await dockerRun(image, packageName, process.cwd(), DIRECTUS_VERSION);
