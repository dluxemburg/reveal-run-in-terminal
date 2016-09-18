const child_process = require('child_process');
const express = require('express');
const path = require('path');

const ARGS_REGEX = /(?:[^\s']+|'[^']*')+/g;
const HEADERS = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive'
};

module.exports = (options) => {
  options = options || {};

  let app = express();
  let commandRegex = options.commandRegex || /\S*/;
  let publicPath = path.resolve(options.publicPath || '.');

  app.use(express.static(publicPath));
  app.use(express.static(path.join(__dirname, 'static')));

  app.get('/reveal-run-in-terminal', (req, res) => {
    let errors = [];

    if (!options.allowRemote && req.ip !== '::1' && req.ip !== '127.0.0.1') {
      errors.push(`command sent to reveal-run-in-terminal from non-localhost (IP was ${req.query.ip})`);
    }

    let bin = req.query.bin;
    if (!commandRegex.test(bin)) {
      errors.push(`command sent to reveal-run-in-terminal didn't match required format (was '${bin}')`);
    }

    let src = path.join(publicPath, req.query.src);
    if (!src.startsWith(publicPath)) {
      errors.push(`command sent to reveal-run-in-terminal specified a file outside of the allowed public path (was '${req.query.src}'')`);
    }

    res.writeHead(200, HEADERS);

    if (errors.length !== 0) {
      let payload = JSON.stringify({messages: errors});
      errors.forEach(err => console.error(`ERROR: ${err}`));
      res.end(`event: error\ndata: ${payload}\n\n`);
      return;
    }

    let args = ((req.query.args || '').match(ARGS_REGEX) || []);
    args = args.map(a => a.replace(/^'(.*)'$/, '$1'));
    args.unshift(src);

    let ps = child_process.spawn(bin, args);

    ['stdout', 'stderr'].forEach(source => {
      ps[source].on('data', (data) => {
        res.write(`data: ${JSON.stringify(data.toString())}\n\n`);
      });
    });

    ps.on('exit', exit => {
      if (options.log) {
        console.log(`${ps.pid}: ${ps.spawnargs.join(' ')} (${exit})`);
      }
      res.write(`event: done\ndata: ${exit}\n\n`);
      res.end();
    });
  });

  return app;
};
