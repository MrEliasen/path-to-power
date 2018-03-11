/*
* @Author: mark
* @Date:   2017-03-01 15:30:19
* @Last Modified by:   Mark Eliasen
* @Last Modified time: 2017-11-30 15:51:05
*/
const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        'babel-polyfill',
        'webpack-dev-server/client',
        './src/index.js',
    ],

    target: 'web',
    devServer: {
            historyApiFallback: true,
            contentBase: './',
    },

    output: {
        path: path.resolve(__dirname, '/'),
        publicPath: '/',
        filename: '[name].js',
    },

    devtool: '#inline-source-map',

    resolve: {
        alias: {
            react: path.resolve(__dirname, './node_modules/react'),
            React: path.resolve(__dirname, './node_modules/react'),
            shared: path.resolve(__dirname, '../server/shared'),
        },
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/,
            },
            {
                test: /\.(scss|css)$/,
                loader: 'style-loader!css-loader?sourceMap!sass-loader?sourceMap',
            },
            {
                test: /\.(png|jpg|wav|mp3)$/,
                loader: 'url-loader?limit=4096',
            },

            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'file-loader',
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
        ],
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        // enable HMR globally
        new webpack.NamedModulesPlugin(),
        // prints more readable module names in the
        // browser console on HMR updates
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.LoaderOptionsPlugin({
            debug: true,
            minimize: false,
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
        }),
        new HTMLWebpackPlugin({
            template: 'index.html',
            inject: true,
        }),
    ],
};
