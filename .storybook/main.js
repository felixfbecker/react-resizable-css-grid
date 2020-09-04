module.exports = {
	stories: ['../src/stories/**/*.stories.tsx'],
	addons: ['@storybook/addon-actions', '@storybook/addon-links'],
	webpackFinal: async config => {
		config.module.rules.push({
			test: /\.(ts|tsx)$/,
			loader: require.resolve('babel-loader'),
			options: {
				presets: [
					'@babel/preset-typescript',
					'@babel/preset-react',
					[
						'@babel/preset-env',
						{
							bugfixes: true,
							targets: [
								'last 1 version',
								'>1%',
								'not dead',
								'not <0.25%',
								'last 1 Chrome versions',
								'not IE > 0',
							],
						},
					],
				],
			},
		})
		config.resolve.extensions.push('.ts', '.tsx')
		return config
	},
}
