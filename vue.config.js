const WebpackCdnPlugin = require('webpack-cdn-plugin')
const express = require('express')

module.exports = {
  devServer: {
    proxy: {
      '/__': {
        target: 'http://localhost:5000',
      },
    },
    setup (app) {
      app.use('/node_modules', express.static('./node_modules'))
    },
  },
  integrity: true,
  configureWebpack: {
    plugins: [
      new WebpackCdnPlugin({
        publicPath: '/node_modules',
        prod: process.env.NODE_ENV === 'production',
        prodUrl: '//cdn.jsdelivr.net/npm/:name@:version/:path',
        modules: [
          { name: 'vue', var: 'Vue', path: 'dist/vue.runtime.min.js' },
          { name: 'three', var: 'THREE', path: 'build/three.min.js' },
          { name: 'axios', path: 'dist/axios.min.js' },
        ],
      }),
    ]
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
}
