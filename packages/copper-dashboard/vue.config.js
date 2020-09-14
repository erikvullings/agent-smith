const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
    lintOnSave: true,
    publicPath: '',
    runtimeCompiler: true,    
    productionSourceMap: true, // NOTE: this is default  
    configureWebpack: {
        devtool: 'source-map',
        resolve: {
            symlinks: false,
            alias: {
                '@': 'src/',
                "Vue": "vue/dist/vue.esm.js"
            }
        },
        plugins: [
            // new BundleAnalyzerPlugin({
            //   analyzerMode: 'disabled',
            //   generateStatsFile: true,
            //   statsOptions: { source: false }
            // }),
        ],
        module: {
            rules: [{
                    test: /\.s(c|a)ss$/,
                    use: [
                        'vue-style-loader',
                        'css-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass'),
                                fiber: require('fibers'),
                                indentedSyntax: true // optional
                            }
                        }
                    ]
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    exclude: ['/public/index.html']
                }
            ]
        }
    }
};