import { createHash as createHash2 } from 'node:crypto';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

async function createTmpFile() {
	const dir = await createTmpDirectory();
	const filename = createHash2('sha1').update((/* @__PURE__ */ new Date()).toString()).digest('hex').slice(0, 8);
	const path4 = path.join(dir.path, filename);

	try {
		const fd = await fs.open(path4, 'wx');
		await fd.close();
	}
	catch (error) {
		await dir.cleanup();
		throw error;
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
	const path4 = await fs.mkdtemp(path.join(tmpdir(), 'directus-'));

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
