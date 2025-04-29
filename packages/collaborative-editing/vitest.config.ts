import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [vue()],
	test: {
		setupFiles: ['./src/test/setup.ts'],
		environment: 'happy-dom',
		globals: true,
		include: [
			'**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
		],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
