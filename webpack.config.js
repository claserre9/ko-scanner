const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		entry:        {
			devtools: './src/devtools.ts',
		},
		output:       {
			path:     path.resolve(__dirname, 'dist'),
			filename: '[name].js',
		},
		resolve:      {
			extensions: ['.ts', '.js'],
		},
		module:       {
			rules: [
				{
					test:    /\.ts$/,
					use:     'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		plugins:      [
			new CleanWebpackPlugin(),
		],
		devtool:      isProduction ? false : 'source-map',
		mode:         argv.mode,
		optimization: {
			minimize:  isProduction,
			minimizer: [new TerserPlugin()],
		},
	};
};