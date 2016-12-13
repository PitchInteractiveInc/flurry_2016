var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname,'source/index.js'),
  output: {
    path: path.resolve(__dirname,'build'),
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.json$/, include: /node_modules/, loader: "json-loader" },
      { test: /\.js$/, exclude: /node_modules|bower_components/, loader: 'babel-loader', query: {presets: ['es2015']}},
      { test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader', query: {presets: ['es2015']} },
      { test: /\.(png|jpg|svg)$/, loader: 'file-loader?' },
      {
        test: /\.scss$/,
        loaders: [
          "style",
          "css",
          // "autoprefixer?browsers=last 2 version",
          "sass",
        ],
      },
      {
        test: /\.css$/,
        loaders: [
          'style', 'css',
        ]
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'source/index.html',
      filename: 'index.html'
    })
  ],
}
