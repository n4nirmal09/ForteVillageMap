'use strict'
const path = require('path')

module.exports = {
	dev: {
		assetsSubDirectory: '',
		assetsPublicPath: '/',
		sourceMap: true,
		/**
	  * Source Maps
	  */
		devtool: 'eval-cheap-module-source-map',
		errorOverlay: {
			warnings: true,
			errors: true,
		},

	},

	build: {
		assetsRoot: path.resolve(__dirname, '../dist'),
		assetsSubDirectory: '',
		assetsPublicPath: '/',
		sourceMap: false,
		devtool: 'source-map',
	}
}