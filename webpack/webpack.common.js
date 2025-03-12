const path = require('path');
const { rspack } = require('@rspack/core');
const srcDir = path.join(__dirname, '..', 'src');

const prod = process.env.NODE_ENV !== 'development';

module.exports = {
  experiments: {
    css: true,
  },
  entry: {
    popup: path.join(srcDir, 'popup.tsx'),
    options: path.join(srcDir, 'options.tsx'),
    background: path.join(srcDir, 'background.ts'),
    content_script: path.join(srcDir, 'content_script.tsx'),
  },
  output: {
    path: path.join(__dirname, '../dist/js'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks(chunk) {
        return chunk.name !== 'background';
      },
    },
  },
  module: {
    parser: {
      'css/auto': {
        namedExports: false,
      },
    },
    rules: [
      // {
      //   test: /\.css$/,
      //   use: [
      //     {
      //       loader: 'builtin:lightningcss-loader',
      //       /** @type {import('@rspack/core').LightningcssLoaderOptions} */
      //       options: {
      //         minify: prod,
      //         targets: 'Chrome >= 48',
      //       },
      //     },
      //     // ... other loaders
      //   ],
      // },
      {
        test: /\.(j|t)s$/,
        exclude: [/[\\/]node_modules[\\/]/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
            externalHelpers: true,
            transform: {
              react: {
                runtime: 'automatic',
                development: !prod,
                refresh: !prod,
              },
            },
          },
          env: {
            targets: 'Chrome >= 48',
          },
        },
      },
      {
        test: /\.(j|t)sx$/,
        loader: 'builtin:swc-loader',
        exclude: [/[\\/]node_modules[\\/]/],
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
                development: !prod,
                refresh: !prod,
              },
            },
            externalHelpers: true,
          },
          env: {
            targets: 'Chrome >= 48', // browser compatibility
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
    }),
  ],
};
