import * as fs from 'fs';
import * as path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import NpmImportPlugin from 'less-plugin-npm-import';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { Configuration, DefinePlugin, ProvidePlugin, RuleSetRule } from 'webpack';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import { getUserOptions } from './options';
import { paths } from './paths';

const {
    // cwd,
    react = {} as any,
    compile: compileOptions,
    devServer: devServerOptions
} = getUserOptions();

const cssRegex = /\.css$/;
const sassRegex = /\.(scss|sass)$/;
const lessRegex = /\.less$/;

const getCssUse = (isEnvDevelopment: boolean, importLoaders = 2) => ([
    (
        isEnvDevelopment ? 
        { loader: require.resolve('style-loader') } :
        { loader: MiniCssExtractPlugin.loader }
    ),
    {
        loader: 'css-loader',
        options: {
            importLoaders,
            modules: {
                auto: true,
                mode: 'local',
                namedExport: true
            },
            sourceMap: compileOptions.useSourceMap,
        }
    },
    {
        loader: 'postcss-loader',
        options: {
            sourceMap: compileOptions.useSourceMap,
            postcssOptions: {
                ident: 'postcss',
                config: fs.existsSync(paths.postcssConfig),
                plugins: [
                    'postcss-flexbugs-fixes',
                    ['postcss-preset-env', {
                        autoprefixer: {
                            flexbox: 'no-2009',
                        },
                        stage: 3,
                    }],
                ]
            }
        }
    }
] as RuleSetRule['use']);


export const getBabelOptions = (isEnvProduction: boolean, isAppScript: boolean) => {
    if (fs.existsSync(paths.babelConfig)) {
        return require(paths.babelConfig);
    }
    return {
        presets: [
            ['@babel/preset-env', { 
                useBuiltIns: 'entry',
                corejs: 3,
                exclude: ['transform-typeof-symbol'],
            }],
            isAppScript && ['@babel/preset-react', {
                development: !isEnvProduction,
                useBuiltIns: true,
                runtime: 'classic',
            }],
            isAppScript && ['@babel/preset-typescript', {
                allowNamespaces: true
            }].filter(Boolean),
        ],
        plugins: [
            !isEnvProduction &&
            isAppScript &&
            react.useReactRefresh &&
                 require.resolve('react-refresh/babel'),
            isAppScript && ["@babel/plugin-proposal-decorators", { 
                decoratorsBeforeExport: true,
                legacy: true,
            }],
            isAppScript && ["@babel/plugin-proposal-class-properties", {
                loose: true,
            }],
            isAppScript && ["@babel/plugin-proposal-private-methods", {
                loose: true,
            }],
            isAppScript && ['@babel/plugin-proposal-private-property-in-object', {
                loose: true,
            }],
            ['@babel/plugin-transform-runtime', {
                corejs: false,
                helpers: true,
                version: require('@babel/runtime/package.json').version,
                regenerator: true,
            }],
        ].filter(Boolean),
        compact: isEnvProduction,
    }
}

export const getWebpackConfig = (webpackEnv: 'development' | 'production' = 'production'):Configuration => {
    const isEnvDevelopment = webpackEnv === 'development';
    const isEnvProduction = webpackEnv === 'production';
    const isEnvProductionProfile =
        isEnvProduction && process.argv.includes('--profile');
    return {
        target: fs.existsSync(paths.browserslist) ? ['web', 'browserslist'] : 'web',
        mode: webpackEnv,
        bail: isEnvProduction,
        devtool: isEnvProduction
            ? (compileOptions.useSourceMap ? 'source-map' : false)
            : isEnvDevelopment && 'cheap-module-source-map',
        entry: paths.baseOptions,
        output: {
            publicPath: 'auto',
            path: paths.outputPath,
            pathinfo: isEnvDevelopment,
            filename: isEnvProduction
                ? 'base-js-[name].[contenthash:8].js'
                : 'base-js-bundle.js',
            chunkFilename: isEnvProduction
                ? 'base-js-[name].[contenthash:8].chunk.js'
                : 'base-js-[name].chunk.js',
            assetModuleFilename: 'media/[hash][ext][query]'
        },
        cache: {
            type: 'filesystem',
            cacheDirectory: paths.webpackCache,
            store: 'pack',
            buildDependencies: {
                config: [__filename, path.resolve(paths.workspace, './tsconfig.json'), path.resolve(paths.workspace, './package.json')],
                tsconfig: [paths.tsconfig, paths.jsconfig, paths.packageJson].filter(f => fs.existsSync(f))
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
                new CssMinimizerPlugin(),
            ]
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin({ configFile: paths.tsconfig})],
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            modules: ['node_modules'],
            symlinks: false,
            alias: { ...compileOptions.alias }
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    enforce: 'pre',
                    test: paths.baseOptions,
                    use: [{ loader: require.resolve('./utils/entry-loader') }]
                },
                compileOptions.useSourceMap && {
                    enforce: 'pre',
                    exclude: /@babel(?:\/|\\{1,2})runtime/,
                    test: /\.(js|mjs|jsx|ts|tsx|css)$/,
                    loader: require.resolve('source-map-loader'),
                },
                {
                    oneOf: [
                        // avif
                        {
                            test: [/\.avif$/],
                            type: 'asset',
                            mimetype: 'image/avif',
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
                                loader: require.resolve('@svgr/webpack'),
                                options: {
                                  prettier: false,
                                  svgo: false,
                                  svgoConfig: {
                                    plugins: [{ removeViewBox: false }],
                                  },
                                  titleProp: true,
                                  ref: true,
                                },
                              },
                              {
                                loader: require.resolve('file-loader'),
                                options: {
                                  name: 'media/[name].[hash].[ext]',
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
                            loader: require.resolve('babel-loader'),
                            options: {
                                ...getBabelOptions(isEnvProduction, true),
                                cacheDirectory: true,
                                cacheCompression: false,
                                compact: isEnvProduction,
                            }
                        },
                        // lib script 
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            loader: require.resolve('babel-loader'),
                            options: {
                                babelrc: false,
                                configFile: false,
                                compact: false,
                                ...getBabelOptions(isEnvProduction, false),
                                cacheDirectory: true,
                                cacheCompression: false,
                                sourceMaps: compileOptions.useSourceMap,
                                inputSourceMap: compileOptions.useSourceMap,
                            }
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
                                    loader: require.resolve('resolve-url-loader'),
                                    options: {
                                      sourceMap: compileOptions.useSourceMap,
                                      root: paths.workspace,
                                    },
                                },
                                {
                                    loader: require.resolve('sass-loader'),
                                    options: {
                                        sourceMap: compileOptions.useSourceMap,
                                    },
                                }
                            ]
                        },
                        // 支持 less
                        {
                            test: lessRegex,
                            use: [
                                ...getCssUse(isEnvDevelopment, 3) as any[],
                                {
                                    loader: require.resolve('resolve-url-loader'),
                                    options: {
                                      sourceMap: compileOptions.useSourceMap,
                                      root: paths.workspace,
                                    },
                                },
                                {
                                    loader: require.resolve('less-loader'),
                                    options: {
                                        sourceMap: compileOptions.useSourceMap,
                                        lessOptions: {
                                            javascriptEnabled: true,
                                            relativeUrls: true,
                                            plugins: [
                                                new NpmImportPlugin({ prefix: '~' })
                                            ]
                                        },
                                    }
                                }
                            ]
                        },
                        {
                            // 其他的未匹配到的，全部归为资源模块
                            exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                            type: 'asset/resource',
                        }
                    ]
                },
            ].filter(Boolean) as any [],
        },
        plugins: [
            new DefinePlugin({
                process: {
                    env: {
                        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                        ...compileOptions.defineMapping
                    }
                }
            }),
            new ProvidePlugin(compileOptions.definitions),
            isEnvDevelopment && react.useReactRefresh && new ReactRefreshWebpackPlugin({
                overlay: false,
            }),
            isEnvProduction && new MiniCssExtractPlugin({
                filename: 'base-css-[name].[contenthash:8].css',
                chunkFilename: 'base-css-[id].[contenthash:8].chunk.css',
                ignoreOrder: true
            }),
        ].filter(Boolean) as any[],
    }
}
export const devServerConfig:Configuration['devServer'] = {
    port: devServerOptions.port,
    host: '0.0.0.0',
    hot: false,
    compress: true,
    liveReload: true,
    historyApiFallback: true,
    https: devServerOptions.protocol === 'https',
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    devMiddleware: {
        writeToDisk: true,
    },
    
    // open: true,
    // openPage: `http://${UserOptions.dev.hostname}:${UserOptions.dev.port}`,
}