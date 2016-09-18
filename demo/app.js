const express = require('express');
const path = require('path');
const revealRunInTerminal = require('../index.js');

let app = express();

app.use(revealRunInTerminal({
  publicPath: __dirname,
  commandRegex: /node|ruby/,
  log: true
}));

let revealJsPath = path.resolve(__dirname, '../node_modules/reveal.js');
app.use(express.static(revealJsPath));

app.listen(5000);
