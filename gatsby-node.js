const fs = require("fs-extra");

const DEFAULT_JS_DIR = "js";
const DEFAULT_CSS_DIR = "css";

const ROOT_PATH = process.cwd();
const PUBLIC_DIR = "./public";
const CACHE_DIR = "./.cache";
const PUBLIC_PATH = ROOT_PATH + "/" + PUBLIC_DIR;
const CACHE_PATH = ROOT_PATH + "/" + CACHE_DIR;

exports.onPreBuild = (args, pluginOptions) => {
	const cleanPublic = pluginOptions.cleanPublic || false;

	//Remove public folder
	if (cleanPublic) {
		fs.removeSync(PUBLIC_PATH);
	}
};

exports.onPostBuild = (args, pluginOptions) => {
	const removeArtifacts = pluginOptions.removeArtifacts || false;

	//Remove build artifacts
	if (removeArtifacts && process.env.NODE_ENV === "production") {
		fs.removeSync(PUBLIC_PATH + "/webpack.stats.json");
		fs.removeSync(PUBLIC_PATH + "/chunk-map.json");
	}
};

//Modifies webpack config to output js/css into correct directories
exports.onCreateWebpackConfig = ({ getConfig, stage, actions }, pluginOptions) => {
	const removeHashes = pluginOptions.removeHashes || false;
	const noJsMap = pluginOptions.noJsMap || false;
	const jsDir = pluginOptions.jsDir || DEFAULT_JS_DIR;
	const cssDir = pluginOptions.cssDir || DEFAULT_CSS_DIR;

	var webpackConfig = Object.assign({}, getConfig()); //Copy

	switch (stage) {
		case "build-javascript":
			webpackConfig.output = {
				filename: `[name]${removeHashes ? "" : ".[contenthash]"}.js`,
				chunkFilename: `[name]${removeHashes ? "" : ".[contenthash]"}.js`,
				path: `${PUBLIC_PATH}/${jsDir}/`,
				publicPath: `/${jsDir}/`,
			};

			//Remove map files
			if (noJsMap) {
				webpackConfig.devtool = false;
			}

			webpackConfig.plugins = webpackConfig.plugins.map((plugin) => {
				//Hacky... used to identify the MiniCssExtractPlugin
				if (plugin.options && plugin.options.filename && /\.css$/.test(plugin.options.filename) && plugin.options.chunkFilename && /\.css$/.test(plugin.options.chunkFilename)) {
					//console.log("Found MiniCssExtractPlugin!");
					plugin.options.filename = `../${cssDir}/[name]${removeHashes ? "" : ".[contenthash]"}.css`;
					plugin.options.chunkFilename = `../${cssDir}/[name]${removeHashes ? "" : ".[contenthash]"}.css`;
				}
				return plugin;
			});

			webpackConfig.plugins.unshift(new WebpackRenamer(pluginOptions));

			actions.replaceWebpackConfig(webpackConfig);
			break;
	}
}

//This renames chunk files so the correct path is written into the page/js
class WebpackRenamer {
	constructor(options) {
		this.plugin = { name: "WebpackRenamer" }
		this.options = options || {}
	}
	apply(compiler) {
		const jsDir = this.options.jsDir || DEFAULT_JS_DIR;
		const cssDir = this.options.cssDir || DEFAULT_CSS_DIR;

		compiler.hooks.done.tap(this.plugin, (stats) => {
			for (var chunkGroup in stats.compilation.chunkGroups) {
				chunkGroup = stats.compilation.chunkGroups[chunkGroup];
				if (!chunkGroup.name) {
					continue;
				}

				for (var i = 0; i < chunkGroup.chunks.length; i++) {
					var chunk = chunkGroup.chunks[i];
					chunk.files = chunk.files.map((file) => {
						if (new RegExp(`^(?!${jsDir}).+?\\.(map|js)$`).test(file)) {
							return jsDir + "/" + file;
						}
						if (new RegExp(`^(?!${cssDir}).+?\\.(css)$`).test(file)) {
							return cssDir + "/" + file;
						}
						return file;
					});
				}
			}
		})
	}
}