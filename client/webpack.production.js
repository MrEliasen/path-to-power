/*
* @Author: Mark Eliasen
* @Date:   2017-03-01 17:44:28
* @Last Modified by:   Mark Eliasen
* @Last Modified time: 2017-12-01 17:43:23
*/
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        'babel-polyfill',
        './src/index.js',
    ],

    output: {
        // the output bundle
        path: path.resolve(__dirname, 'dist'),
        filename: 'output.[hash].bundle.js',
        chunkFilename: '[id].[hash].bundle.js',
        publicPath: '/',
    },

    resolve: {
        alias: {
            react: path.resolve(__dirname, './node_modules/react'),
            React: path.resolve(__dirname, './node_modules/react'),
            shared: path.resolve(__dirname, '../server/shared'),
        },
    },

    devtool: '#inline-source-map',

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name]-[hash].[ext]',
                            outputPath: 'assets/svgs/',
                        },
                    },
                    {
                        loader: 'svgo-loader',
                        options: {
                            plugins: [
                                {removeTitle: true},
                                {convertColors: {shorthex: false}},
                                {convertPathData: false},
                            ],
                        },
                    },
                ],
            },
            {
                test: /(\.css|\.scss)$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: false,
                                modules: true,
                                importLoaders: true,
                                localIdentName: '[local]',
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: function() {
                                    return [
                                        require('autoprefixer'),
                                    ];
                                },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: false,
                                includePaths: [
                                    'node_modules',
                                    'bower_components',
                                    'src/Assets',
                                ],
                            },
                        },
                    ],
                }),
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/,
                loader: 'file-loader',
                options: {
                    name: '[name]-[hash].[ext]',
                    outputPath: 'assets/images/',
                },
            },
            {
                test: /\.(wav|mp3|ogg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'assets/media/',
                },
            },
        ],
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            comments: false,
        }),
        new webpack.LoaderOptionsPlugin({
            debug: false,
            minimize: true,
        }),
        new ExtractTextPlugin({
            filename: 'assets/[hash].main.css',
            allChunks: true,
        }),
        new HTMLWebpackPlugin({
                template: 'index.html',
                inject: true,
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
            },
        }),
    ],
};
