import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';

const isDev = process.env.NODE_ENV === 'development';

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['Chrome >= 48'];

export default defineConfig({
  context: __dirname,
  entry: {
    popup: './src/popup.tsx',
    options: './src/options.tsx',
    background: './src/background.ts',
    content_script: './src/content_script.tsx',
  },
  output: {
    path: './dist/js',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['...', '.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(svg|png)$/,
        type: 'asset',
      },
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
                development: isDev,
                refresh: isDev,
              },
            },
          },
          env: {
            env: { targets },
          },
        },
      },
      {
        test: /\.(j|t)sx$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
              env: { targets },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
    }),
    // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        // plugin options
      }),
  ].filter(Boolean),
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks(chunk) {
        return chunk.name !== 'background';
      },
    },
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  experiments: {
    css: true,
  },
  devtool: isDev ? 'inline-source-map' : undefined,
});
