// Libraries
const path = require('path');
const config = require('./config');
const packageName = require('../package.json').name;
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
//const SassLintPlugin = require('sass-lint-webpack');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');

// Files
const utils = require('./utils')
const plugins = require('../postcss.config');


// Configuration
module.exports = env => {

    
    const cssLoader = {
        loader: 'css-loader',
        options: {
            url: true,
            importLoaders: 2,
            sourceMap: env.production ? config.build.sourceMap : config.dev.sourceMap
        }
    }

    const cssLoaderModule = {
        loader: 'css-loader',
        options: {
            url: true,
            importLoaders: 1,
            sourceMap: env.production ? config.build.sourceMap : config.dev.sourceMap,
            modules: true
        }
    }



    const postCssLoader = {
        loader: 'postcss-loader',
        options: {
            sourceMap: env.production ? config.build.sourceMap : config.dev.sourceMap
        }
    }

    const sassLoader = {
        loader: 'sass-loader',
        options: {
            sourceMap: env.production ? config.build.sourceMap : config.dev.sourceMap
        }
    }

    const miniCssLoader = {
        loader: MiniCssExtractPlugin.loader,
        options: {
            publicPath: '../'
        }
    }

    let styleMiniLoader = null
    if (env.development) {
        styleMiniLoader = {
            loader: 'style-loader',
            options: { injectType: 'styleTag' }
        }
    } else {
        styleMiniLoader = miniCssLoader
    }

    return {
        context: path.resolve(__dirname, '../src'),
        target: env.production ? "browserslist" : 'web',
        entry: {
            app: './app.js'
        },
        output: {
            path: config.build.assetsRoot,
            publicPath: env.production ? config.build.assetsPublicPath : config.dev.assetsPublicPath,
            filename: 'js/[name].gmap.[contenthash].bundle.js',
            chunkFilename: (pathData) => {
                return 'js/[name].gmap.[contenthash].min.js';
            }
        },
        devServer: {
            contentBase: path.resolve(__dirname, '../src'),
            overlay: env.development ? config.dev.errorOverlay : false,
            inline: true,
            watchContentBase: true,
        },
        devtool: env.development ? config.dev.devtool : config.build.devtool,
        resolve: {
            extensions: ['.js'],
            alias: {
                '@': path.resolve(__dirname, '../src'), // Relative path of src
                '@images': path.resolve(__dirname, '../src/assets/images'), // Relative path of images
                '@fonts': path.resolve(__dirname, '../src/assets/fonts'), // Relative path of fonts
                '@public': path.resolve(__dirname, '../public'), // Relative path for public
            }
        },

        /*
          Loaders with configurations
        */
        module: {
            rules: [{
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            //'@babel/plugin-transform-object-assign',
                            ["@babel/plugin-transform-runtime",
                                {
                                    "regenerator": true
                                }
                            ]
                        ]
                    }
                }]
            },
            {
                test: /\.css$/,
                use: [
                    env.development ? 'style-loader' : miniCssLoader,
                    cssLoader,
                ],
            },
            {
                test: /\.scss$/,
                exclude: path.resolve(__dirname, '../src/scss/exports'),
                use: [
                    styleMiniLoader, // Styleloader minicssloader switching
                    cssLoader, // translates CSS into CommonJS
                    postCssLoader,
                    sassLoader, // compiles Sass to CSS
                ],
            },
            {
                test: /\.scss$/,
                include: path.resolve(__dirname, '../src/scss/exports'),
                use: [
                    styleMiniLoader, // Styleloader minicssloader switching
                    cssLoaderModule, // translates CSS into CommonJS
                    sassLoader, // compiles Sass to CSS
                ],
            },
            {
                test: /\.pug$/,
                use: [{
                    loader: 'pug3-loader',
                    options: { pretty: true }
                }]
            },
            {
                test: /\.(png|jpe?g|gif|ico|svg)(\?.*)?$/,
                loader: 'url-loader',
                include: path.resolve(__dirname, '../src/assets/images'),
                options: {
                    limit: 3000,
                    name: 'images/[name].[contenthash].[ext]'
                }
            },
            {
                test: /\.svg$/,
                include: path.resolve(__dirname, '../src/assets/svg-sprites'),
                use: [{
                        loader: 'svg-sprite-loader',
                        options: {
                            //extract: true,
                            spriteFilename: 'images/icons.svg'
                        }
                    },
                    'svgo-loader'
                ]
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 5000,
                    name: 'fonts/[name].[contenthash].[ext]'
                }
            },
            {
                test: /\.(mp4)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'videos/[name].[contenthash].[ext]'
                }
            }
            ]
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {}
                }),
                new CssMinimizerPlugin()
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // vendor chunk
                    vendor: {
                        filename: 'js/vendor.gmap.[contenthash].bundle.js',
                        // sync + async chunks
                        chunks: 'all',
                        // import file path containing node_modules
                        name(module) {
                            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                            // npm package names are URL-safe, but some servers don't like @ symbols
                            return `${packageName.replace('@', '')}`;
                        },
                        test: /[\\/]node_modules[\\/]/
                    },
                    // reactVendor: {
                    //     test: /[\\/]node_modules[\\/](react|react-dom|react-spreadsheet|mobx|mobx-react-lite)[\\/]/,
                    //     name: "react.vendor"
                    // },
                    // utilityVendor: {
                    //     test: /[\\/]node_modules[\\/](lodash|moment|moment-timezone|gsap|@popperjs|tinymce|cropperjs)[\\/]/,
                    //     name: "utility.vendor"
                    // }
                    // vendor: {
                    //     test: /[\\/]node_modules[\\/](!react)(!react-dom)(!react-spreadsheet)(!mobx)[\\/]/,
                    //     name: "vendor"
                    // },
                    // // blog chunk
                    // blog: {
                    //     filename: 'js/blog.bundle.js',
                    //     chunks: 'all',
                    //     test: /blog/
                    // }
                }
            }
        },

        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: '../public', to: '' },
                ],
            }),
            new MiniCssExtractPlugin({
                filename: 'css/[name].gmap.[contenthash].bundle.css',
                chunkFilename: (module) => {
                    return module.chunk.name.match(/(darkTheme|daterangepicker|exports|main)/g) ? 'css/[name].gmap.[contenthash].css' : 'css/utilities.gmap.[contenthash].css'
                },
            }),

            /*
              Pages
            */

            // // Desktop page
            new HtmlWebpackPlugin({
                title: packageName,
                filename: 'index.html',
                template: 'views/index.pug',
                inject: 'body'
            }),
            ...utils.pages(env),
            // ...utils.pages(env,'headers'),
            // ...utils.pages(env,'components'),
            // ...utils.pages(env,'forms'),
            new SpriteLoaderPlugin({
                plainSprite: true
            }),
            //new SassLintPlugin(),
            // new webpack.ProvidePlugin({
            //     $: 'jquery',
            //     jQuery: 'jquery',
            //     'window.$': 'jquery',
            //     'window.jQuery': 'jquery'
            // }),
            new WebpackNotifierPlugin({
                title: packageName
            })
        ]
    }
};