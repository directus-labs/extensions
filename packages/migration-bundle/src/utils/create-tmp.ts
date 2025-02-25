import { createHash as createHash2 } from 'node:crypto';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function createTmpFile() {
	const dir = await createTmpDirectory();
	const filename = createHash2('sha1').update((/* @__PURE__ */ new Date()).toString()).digest('hex').substring(0, 8);
	const path4 = join(dir.path, filename);

	try {
		const fd = await fs.open(path4, 'wx');
		await fd.close();
	}
	catch (err) {
		await dir.cleanup();
		throw err;
	}

	async function cleanup() {
		await fs.unlink(path4);
		await dir.cleanup();
	}

	return {
		path: path4,
		cleanup,
	};
}

async function createTmpDirectory() {
	const path4 = await fs.mkdtemp(join(tmpdir(), 'directus-'));

	async function cleanup() {
		return await fs.rmdir(path4);
	}

	return {
		path: path4,
		cleanup,
	};
}

export {
	createTmpFile,
};
