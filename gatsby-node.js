const rimraf = require("rimraf");

const DEFAULT_JS_DIR = "js";
const DEFAULT_CSS_DIR = "css";
const DEFAULT_DELETE_TIMEOUT = 3000;

const ROOT_PATH = process.cwd();
const PUBLIC_DIR = "./public";
const CACHE_DIR = "./.cache";
const PUBLIC_PATH = ROOT_PATH + "/" + PUBLIC_DIR;
const CACHE_PATH = ROOT_PATH + "/" + CACHE_DIR;

exports.onPreInit = (args, pluginOptions, callback) => {
	const cleanCache = pluginOptions.cleanCache || false;
	const cleanPublic = pluginOptions.cleanPublic || false;
	const deleteTimeout = pluginOptions.deleteTimeout || DEFAULT_DELETE_TIMEOUT;

	if (cleanCache) {
		rimraf.sync(CACHE_PATH);
	}
	if (cleanPublic) {
		rimraf.sync(PUBLIC_PATH);
	}

	//Yes this actually makes a difference. Otherwise I guess the directories don't have time to fully delete? Idk
	setTimeout(callback, deleteTimeout);
};

exports.onPostBuild = (args, pluginOptions, callback) => {
	const removeArtifacts = pluginOptions.removeArtifacts || false;
	const cleanCache = pluginOptions.cleanCache || false;
	const deleteTimeout = pluginOptions.deleteTimeout || DEFAULT_DELETE_TIMEOUT;

	if (process.env.NODE_ENV !== "production") {
		callback();
		return;
	}

	//Remove build artifacts
	if (removeArtifacts) {
		rimraf.sync(PUBLIC_PATH + "/webpack.stats.json");
		rimraf.sync(PUBLIC_PATH + "/chunk-map.json");
	}

	if (cleanCache) {
		rimraf.sync(CACHE_PATH);
	}

	//Yes this actually makes a difference. Otherwise I guess the directories don't have time to fully delete? Idk
	setTimeout(callback, deleteTimeout);
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
						if (new RegExp(`^(?!${jsDir}).+?\\.(map|js|svg|png|jpg)$`).test(file)) {
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
