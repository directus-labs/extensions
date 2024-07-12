import image from '@rollup/plugin-image';

export default {
  plugins: [
    image({
      dom: false,
      include: /\.(png|jpg)$/,
    }),
  ]
}
