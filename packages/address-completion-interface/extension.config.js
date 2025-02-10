import url from '@rollup/plugin-url';
import copy from 'rollup-plugin-copy';

export default {
	plugins: [
		url(),
		copy({
			targets: [
				{ src: 'src/assets/images/**/*', dest: 'dist/public/images' },
			],
		}),
	],
};
