# gatsby-plugin-tidy
Cleans up Gatsby's public directory organizing js/css into folders!  
Does some other stuff too, see the options below.

## Install
```
npm install --save gatsby-plugin-tidy
```

## Usage
Edit or create this file at the root of your project: *gatsby-config.js*
```
module.exports = {
    plugins: [
        {
            resolve: "gatsby-plugin-tidy",
            options: {
                cleanPublic: true,
                cleanCache: true,
                removeHashes: true,
                removeArtifacts: true,
                noJsMap: true,
                removeInlineStyles: true,
                jsDir: "js",
                cssDir: "css"
            }
        }
    ]
};
```

## Options
- **cleanPublic** | default: false | true = Deletes the *./public* directory on build
- **cleanCache** | default: false | true = Deletes the *./.cache* directory on build
- **removeHashes** | default: false | true = Removes hashes from js/css filenames
- **removeArtifacts** | default: false | true = Removes build artifacts *./public/webpack.stats.json* and *./public/chunk-map.json*
- **noJsMap** | default: false | true = Don't generate js .map files
- **removeInlineStyles** | default: false | true = Don't put styles inline in html
- **jsDir** | default: "js" | Change the output directory for js/map files relative to *./public*
- **cssDir** | default: "css" | Change the output directory for css files relative to *./public*

#### Possible errors
- **Error: ENOENT: no such file or directory, open '...\public\page-data\  index\page-data.json'** | delete the *.cache* directory and retry
- **Blank page using *gatsby develop*** | delete the *.cache* directory and retry
  
The *cleanCache* option helps and runs onPreInit however cached content may have already been loaded before the plugin hook executes