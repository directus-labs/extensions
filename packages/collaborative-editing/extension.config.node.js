import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	plugins: [
		nodeResolve({
			exportConditions: ['node'],
			preferBuiltins: true,
		}),
	],
	external: ['node:crypto', 'crypto'],
};
