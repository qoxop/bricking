import * as fs from 'fs';
import * as path from 'path';
import WebpackBar from 'webpackbar';
import TerserPlugin from 'terser-webpack-plugin';
import NpmImportPlugin from 'less-plugin-npm-import';
import {
  merge as webpackMerge,
} from 'webpack-merge';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import {
  Configuration,
  DefinePlugin,
  ProvidePlugin,
  RuleSetRule,
} from 'webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
  getUserOptions,
} from './options';
import {
  getCustomWebpackPath,
  paths,
} from './paths';
import BrickingPackPlugin from './utils/pack-plugin';

const RS = require.resolve;

const {
  react = {} as any,
  compile: compileOptions,
  publicPath,
  devServer: { hostname, ...devServerOptions },
} = getUserOptions();

const cssRegex = /\.css$/;
const sassRegex = /\.(scss|sass)$/;
const lessRegex = /\.less$/;

const getCssUse = (isEnvDevelopment: boolean, importLoaders = 2) => ([
  {
    loader: RS('style-loader'),
  },
  {
    loader: RS('css-loader'),
    options: {
      importLoaders,
      modules: {
        auto: true,
        mode: 'local',
        namedExport: true,
      },
      sourceMap: compileOptions.useSourceMap,
    },
  },
  {
    loader: RS('postcss-loader'),
    options: {
      sourceMap: compileOptions.useSourceMap,
      postcssOptions: {
        ident: 'postcss',
        config: fs.existsSync(paths.postcssConfig),
        plugins: [
          [RS('cssnano')],
          [RS('postcss-flexbugs-fixes')],
          [RS('postcss-preset-env'), {
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }],
        ],
      },
    },
  },
] as RuleSetRule['use']);

export const getBabelOptions = (isEnvProduction: boolean, isAppScript: boolean) => {
  if (fs.existsSync(paths.babelConfig)) {
    return require(paths.babelConfig);
  }
  return {
    sourceType: 'unambiguous',
    presets: [
      [RS('@babel/preset-env'), {
        useBuiltIns: 'entry',
        corejs: 3,
        exclude: ['transform-typeof-symbol'],
      }],
      isAppScript && [RS('@babel/preset-react'), {
        development: !isEnvProduction,
        // useBuiltIns: true,
        runtime: 'classic',
      }],
      isAppScript && [RS('@babel/preset-typescript'), {
        allowNamespaces: true,
      }],
    ].filter(Boolean),
    plugins: [
      !isEnvProduction
            && isAppScript
            && react.useReactRefresh
            && RS('react-refresh/babel'),
      isAppScript && [RS('@babel/plugin-proposal-decorators'), {
        legacy: true,
      }],
      isAppScript && [RS('@babel/plugin-proposal-class-properties'), {
        loose: true,
      }],
      isAppScript && [RS('@babel/plugin-proposal-private-methods'), {
        loose: true,
      }],
      isAppScript && [RS('@babel/plugin-proposal-private-property-in-object'), {
        loose: true,
      }],
      [RS('@babel/plugin-transform-runtime'), {
        corejs: false,
        helpers: true,
        regenerator: true,
      }],
    ].filter(Boolean),
    compact: isEnvProduction,
  };
};

export const getWebpackConfig = (webpackEnv: 'development' | 'production' = 'production', devEntry = ''): Configuration => {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');
  const baseConfig = {
    target: fs.existsSync(paths.browserslist) ? ['web', 'browserslist'] : 'web',
    mode: webpackEnv,
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? (compileOptions.useSourceMap ? 'source-map' : false)
      : isEnvDevelopment && 'cheap-module-source-map',
    entry: {
      bricking: paths.brickingrc,
      ...(devEntry ? { devEntry } : {}),
    },
    output: {
      clean: true,
      publicPath: publicPath || 'auto',
      path: path.join(paths.outputPath, 'packages'),
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? 'base-js-[name].[chunkhash:8].js'
        : 'base-js-[name].js',
      chunkFilename: isEnvProduction
        ? 'chunk-js-[name].[chunkhash:8].js'
        : 'chunk-js-[name].chunk.js',
      assetModuleFilename: 'media/[hash][ext][query]',
    },
    cache: {
      type: 'filesystem',
      cacheDirectory: paths.webpackCache,
      store: 'pack',
      buildDependencies: {
        config: [__filename, paths.tsconfig, paths.packageJson],
        tsconfig: [paths.tsconfig, paths.jsconfig, paths.packageJson].filter((f) => fs.existsSync(f)),
      },
    },
    infrastructureLogging: {
      level: 'none',
    },
    optimization: {
      runtimeChunk: false,
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 2018,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
    },
    resolve: {
      plugins: [new TsconfigPathsPlugin({
        configFile: paths.tsconfig,
      })],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      modules: ['node_modules'],
      symlinks: true,
      alias: {
        ...compileOptions.alias,
      },
    },
    module: {
      strictExportPresence: true,
      rules: [{
        enforce: 'pre',
        test: paths.brickingrc,
        use: [{
          loader: RS('./utils/entry-loader'),
        }],
      },
      compileOptions.useSourceMap && {
        enforce: 'pre',
        exclude: /@babel(?:\/|\\{1,2})runtime/,
        test: /\.(js|mjs|jsx|ts|tsx|css)$/,
        loader: RS('source-map-loader'),
      },
      {
        oneOf: [
          // avif
          {
            test: [/\.avif$/],
            type: 'asset',
            mimetype: 'image/avif',
            generator: {
              filename: 'img-[hash][ext]',
            },
            parser: {
              dataUrlCondition: {
                maxSize: compileOptions.imageInlineSizeLimit,
              },
            },
          },
          // images
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            type: 'asset',
            generator: {
              filename: 'img-[hash][ext]',
            },
            parser: {
              dataUrlCondition: {
                maxSize: compileOptions.imageInlineSizeLimit,
              },
            },
          },
          // svg
          {
            test: /\.svg$/,
            use: [
              react?.useSvgr && {
                loader: RS('@svgr/webpack'),
                options: {
                  prettier: false,
                  svgo: false,
                  svgoConfig: {
                    plugins: [{
                      removeViewBox: false,
                    }],
                  },
                  titleProp: true,
                  ref: true,
                },
              },
              {
                loader: RS('file-loader'),
                options: {
                  name: 'svg-[name].[hash].[ext]',
                },
              },
            ].filter(Boolean),
            issuer: {
              and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
            },
          },
          // app script
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            exclude: /(node_modules|bower_components)/,
            loader: RS('babel-loader'),
            options: {
              ...getBabelOptions(isEnvProduction, true),
              cacheDirectory: true,
              cacheCompression: false,
              compact: isEnvProduction,
            },
          },
          // lib script
          {
            test: /\.(js|mjs)$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: RS('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              ...getBabelOptions(isEnvProduction, false),
              cacheDirectory: true,
              cacheCompression: false,
              sourceMaps: compileOptions.useSourceMap,
              inputSourceMap: compileOptions.useSourceMap,
            },
          },
          // css
          {
            test: cssRegex,
            use: getCssUse(isEnvDevelopment, 1),
            sideEffects: true,
          },
          // 支持 sass
          {
            test: sassRegex,
            use: [
              ...getCssUse(isEnvDevelopment, 3) as any[],
              {
                loader: RS('resolve-url-loader'),
                options: {
                  sourceMap: compileOptions.useSourceMap,
                  root: paths.workspace,
                },
              },
              {
                loader: RS('sass-loader'),
                options: {
                  sourceMap: compileOptions.useSourceMap,
                },
              },
            ],
          },
          // 支持 less
          {
            test: lessRegex,
            use: [
              ...getCssUse(isEnvDevelopment, 3) as any[],
              {
                loader: RS('resolve-url-loader'),
                options: {
                  sourceMap: compileOptions.useSourceMap,
                  root: paths.workspace,
                },
              },
              {
                loader: RS('less-loader'),
                options: {
                  sourceMap: compileOptions.useSourceMap,
                  lessOptions: {
                    javascriptEnabled: true,
                    relativeUrls: true,
                    plugins: [
                      new NpmImportPlugin({
                        prefix: '~',
                      }),
                    ],
                  },
                },
              },
            ],
          },
          {
            // 其他的未匹配到的，全部归为资源模块
            exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            type: 'asset/resource',
            generator: {
              filename: 'asset-[hash][ext]',
            },
          },
        ],
      },
      ].filter(Boolean) as any[],
    },
    plugins: [
      new WebpackBar(),
      new DefinePlugin({
        process: {
          env: {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            ...compileOptions.defineMapping,
          },
        },
      }),
      new ProvidePlugin(compileOptions.definitions),
      isEnvDevelopment && react.useReactRefresh && new ReactRefreshWebpackPlugin({
        overlay: false,
      }),
      new BrickingPackPlugin(),
      !!devEntry && new HtmlWebpackPlugin({
        ...compileOptions.htmlOptions,
        chunks: ['bricking', 'devEntry'],
        chunksSortMode: 'manual',

      }),
    ].filter(Boolean) as any[],
  };
  const customConfigPath = getCustomWebpackPath();
  if (customConfigPath) {
    const mergeConf = require(customConfigPath);
    if (typeof mergeConf === 'function') {
      return mergeConf(baseConfig);
    } if (mergeConf && typeof mergeConf === 'object') {
      return webpackMerge(mergeConf);
    }
  }
  return baseConfig as any;
};

export const devServerConfig: Configuration['devServer'] = {
  host: '0.0.0.0',
  hot: false,
  compress: true,
  liveReload: true,
  historyApiFallback: true,
  https: false,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
  devMiddleware: {
    writeToDisk: true,
  },
  ...devServerOptions,
};
