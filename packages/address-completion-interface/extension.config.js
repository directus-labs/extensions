import copy from 'rollup-plugin-copy';
import url from '@rollup/plugin-url';

export default {
  plugins: [
    url(),
    copy({
      targets: [
        { src: 'src/assets/images/**/*', dest: 'dist/public/images' },
      ]
    })
  ],
};