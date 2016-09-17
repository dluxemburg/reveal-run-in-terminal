const express = require('express');
const path = require('path');
const revealTerminalSlides = require('../index.js');

let revealJsPath = path.resolve(__dirname, '../node_modules/reveal.js');
let app = express();

app.use(revealTerminalSlides({
  publicPath: __dirname,
  commandRegex: /node|ruby/,
  log: true
}));
app.use(express.static(revealJsPath));

app.listen(5000);
