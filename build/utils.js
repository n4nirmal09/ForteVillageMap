exports.pages = function (env, folder = '') {
  const rootPagesFolderName = 'pages'
  const HtmlWebpackPlugin = require('html-webpack-plugin')
  const fs = require('fs')
  const path = require('path')
  const viewsFolder = path.resolve(__dirname, `../src/views/${rootPagesFolderName}/${folder}`)

  var pages = []

  fs.readdirSync(viewsFolder).forEach(view => {
    if (view.split('.')[1] === undefined)
      return false;

    const viewName = view.split('.')[0];
    const fileName = folder === '' ? `${viewName}.html/index.html` : `${folder}/${viewName}/index.html`;
    const options = {
      filename: fileName,
      template: `views/${rootPagesFolderName}/${folder}/${view}`,
      inject: 'body'
    };

    options.minify = {
      removeComments: env.development ? true : false,
      collapseWhitespace: env.development ? true : true,
      removeAttributeQuotes: env.development ? true : false
    };

    pages.push(new HtmlWebpackPlugin(options));
  })

  return pages;
}
