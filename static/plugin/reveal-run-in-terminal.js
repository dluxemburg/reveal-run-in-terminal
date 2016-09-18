(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],3:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":1,"./encode":2}],4:[function(require,module,exports){
module.exports = class {
  static highlight(code) {
    this._instance = this._instance || new this();
    return this._instance.highlight(code);
  }

  constructor() {
    this.worker = new Worker('/plugin/reveal-run-in-terminal-hljs-worker.js');
    this.pending = {};
    this.worker.onmessage = (event) => {
      this.pending[event.data.callbackId].resolve(event.data.code.value);
      delete this.pending[event.data.callbackId];
    };
  }

  highlight(code) {
    let callbackId = (Date.now() + Math.random()).toString(16);
    return new Promise((resolve, reject) => {
      this.pending[callbackId] = {resolve, reject};
      this.worker.postMessage({callbackId, code});
    });
  }
}

},{}],5:[function(require,module,exports){
const Slide = require('./slide');

window.RunInTerminal = class {
  static init(options) {
    let runInTerminal = new this(options);
    runInTerminal.load();

    Reveal.addEventListener('fragmentshown', function(event) {
      if (!event.fragment.dataset.terminalFragment) return;
      let slide = runInTerminal.forSection(event.fragment.parentElement);

      if (event.fragment.dataset.terminalFragment === 'showCommand') {
        slide.renderCommand();
        slide.scrollToBottom();
      } else if (event.fragment.dataset.terminalFragment === 'execute') {
        slide.executeCommand();
      }
    });

    Reveal.addEventListener('fragmenthidden', function(event) {
      if (!event.fragment.dataset.terminalFragment) return;
      let slide = runInTerminal.forSection(event.fragment.parentElement);

      if (event.fragment.dataset.terminalFragment === 'showCommand') {
        slide.renderPrompt();
      } else if (event.fragment.dataset.terminalFragment === 'execute') {
        slide.renderCommand();
      }
    });

    Reveal.addEventListener('slidechanged', function(event) {
      let slide = runInTerminal.forSection(event.currentSlide);
      if (slide && slide.clearOnShow) slide.renderPrompt();
      runInTerminal.reload({except: [slide]});
    });

    return runInTerminal;
  }

  constructor(options) { this.options = options || {}; }

  load() {
    let sections = document.querySelectorAll('section[data-run-in-terminal]');
    this.slides = [].map.call(sections, section => {
      return new Slide(section, this.options);
    });
  }

  reload(options = {except: []}) {
    this.slides
      .filter(s => options.except.indexOf(s) !== -1)
      .forEach(s => s.load());
  }

  forSection(section) {
    return this.slides.filter((s) => s.section === section)[0];
  }
};

},{"./slide":7}],6:[function(require,module,exports){
const querystring = require('querystring');

module.exports = (params, fn) => {
  let qs = querystring.stringify(params);
  return new Promise((resolve, reject) => {
    let source = new EventSource(`/reveal-run-in-terminal?${qs}`);
    source.addEventListener('message', e => fn(JSON.parse(e.data)));
    source.addEventListener('done', () => resolve(source.close()));
    source.addEventListener('error', e => {
      if (e.data) {
        let messages = JSON.parse(e.data).messages;
        messages.forEach(err => console.error(err));
        reject(new Error(`${messages.join(', ')}`));
      } else {
        reject(e);
      }

      source.close();
    });
  });
};

},{"querystring":3}],7:[function(require,module,exports){
const runCommand = require('./run-command');
const Highligher = require('./highligher');

module.exports = class {
  constructor(section, options) {
    this.options = options;
    this.section = section;

    this.hide();
    this.addElement('container');

    this.addElement('title', {tagName: 'span', parent: this.container});
    this.title.innerText = this.src;

    ['code', 'term'].forEach(name => this.addElement(name, {
      tagName: 'pre',
      classes: ['hljs'],
      parent: this.container
    }));

    ['showCommand', 'execute'].forEach(name => this.addElement(name, {
      classes: ['fragment'],
      dataset: {terminalFragment: name}
    }));

    this.load();
  }

  load() {
    this.hide();
    return fetch(this.src)
      .then(response => response.text())
      .then(code => Highligher.highlight(code))
      .then(html => this.code.innerHTML = html)
      .then(() => {
        this.addLineNumbers();
        this.container.scrollTop = 0;
        // this.renderPrompt();
        this.show();
      });
  }

  addElement(name, options) {
    options = options || {};

    this[name] = document.createElement(options.tagName || 'div');
    (options.classes || []).concat([name]).forEach(clazz => {
      this[name].classList.add(clazz)
    });
    Object.assign(this[name].dataset, options.dataset || {});

    (options.parent || this.section).appendChild(this[name]);
    return this[name];
  }

  addLineNumbers() {
    [].forEach.call(this.code.querySelectorAll('br'), br => {
      let span = document.createElement('span');
      span.classList.add('line');
      this.code.insertBefore(span, br);
    });
  }

  scrollToBottom() {
    let interval = setInterval(() => {
      let top = this.container.scrollTop;
      this.container.scrollTop += 2;
      if (top === this.container.scrollTop) {
        clearInterval(interval);
      }
    }, 1);
  }

  hide() { this.section.style.display = 'none'; }

  show() { this.section.style.display = 'block'; }

  renderPrompt() { this.term.innerText = `> █`; }

  renderCommand() { this.term.innerText = `> ${this.command}█`; }

  executeCommand() {
    this.term.innerText = `> ${this.command}\n`;
    runCommand(this.params, output => {
      this.term.innerText = `${this.term.innerText.trim()}\n${output}`;
      this.scrollToBottom();
    }).then(() => {
      this.term.innerText = `${this.term.innerText.trim().replace(/█/g, '')}\n> █`;
      this.scrollToBottom();
    }).catch(err => this.term.innerText = err.message);
  }

  property(prop) { return this.section.dataset[prop]; }

  get clearOnShow() {
    return !this.showCommand.classList.contains('visible');
  }

  get command() {
    let command = `${this.bin} ${this.src}`
    if (this.args) command = `${command} ${this.args}`;
    return command;
  }

  get params() {
    let params = {bin: this.bin, src: this.src};
    if (this.args) params.args = this.args;
    return params;
  }

  get bin() {
    return this.property('runInTerminalBin') || this.options.defaultBin;
  }

  get src() { return this.property('runInTerminal'); }

  get args() { return this.property('runInTerminalArgs'); }
};

},{"./highligher":4,"./run-command":6}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyIsInNyYy9oaWdobGlnaGVyLmpzIiwic3JjL3JldmVhbC1ydW4taW4tdGVybWluYWwuanMiLCJzcmMvcnVuLWNvbW1hbmQuanMiLCJzcmMvc2xpZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyB7XG4gIHN0YXRpYyBoaWdobGlnaHQoY29kZSkge1xuICAgIHRoaXMuX2luc3RhbmNlID0gdGhpcy5faW5zdGFuY2UgfHwgbmV3IHRoaXMoKTtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2UuaGlnaGxpZ2h0KGNvZGUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy53b3JrZXIgPSBuZXcgV29ya2VyKCcvcGx1Z2luL3JldmVhbC1ydW4taW4tdGVybWluYWwtaGxqcy13b3JrZXIuanMnKTtcbiAgICB0aGlzLnBlbmRpbmcgPSB7fTtcbiAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMucGVuZGluZ1tldmVudC5kYXRhLmNhbGxiYWNrSWRdLnJlc29sdmUoZXZlbnQuZGF0YS5jb2RlLnZhbHVlKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnBlbmRpbmdbZXZlbnQuZGF0YS5jYWxsYmFja0lkXTtcbiAgICB9O1xuICB9XG5cbiAgaGlnaGxpZ2h0KGNvZGUpIHtcbiAgICBsZXQgY2FsbGJhY2tJZCA9IChEYXRlLm5vdygpICsgTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnBlbmRpbmdbY2FsbGJhY2tJZF0gPSB7cmVzb2x2ZSwgcmVqZWN0fTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtjYWxsYmFja0lkLCBjb2RlfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImNvbnN0IFNsaWRlID0gcmVxdWlyZSgnLi9zbGlkZScpO1xuXG53aW5kb3cuUnVuSW5UZXJtaW5hbCA9IGNsYXNzIHtcbiAgc3RhdGljIGluaXQob3B0aW9ucykge1xuICAgIGxldCBydW5JblRlcm1pbmFsID0gbmV3IHRoaXMob3B0aW9ucyk7XG4gICAgcnVuSW5UZXJtaW5hbC5sb2FkKCk7XG5cbiAgICBSZXZlYWwuYWRkRXZlbnRMaXN0ZW5lcignZnJhZ21lbnRzaG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoIWV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCkgcmV0dXJuO1xuICAgICAgbGV0IHNsaWRlID0gcnVuSW5UZXJtaW5hbC5mb3JTZWN0aW9uKGV2ZW50LmZyYWdtZW50LnBhcmVudEVsZW1lbnQpO1xuXG4gICAgICBpZiAoZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50ID09PSAnc2hvd0NvbW1hbmQnKSB7XG4gICAgICAgIHNsaWRlLnJlbmRlckNvbW1hbmQoKTtcbiAgICAgICAgc2xpZGUuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50ID09PSAnZXhlY3V0ZScpIHtcbiAgICAgICAgc2xpZGUuZXhlY3V0ZUNvbW1hbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIFJldmVhbC5hZGRFdmVudExpc3RlbmVyKCdmcmFnbWVudGhpZGRlbicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoIWV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCkgcmV0dXJuO1xuICAgICAgbGV0IHNsaWRlID0gcnVuSW5UZXJtaW5hbC5mb3JTZWN0aW9uKGV2ZW50LmZyYWdtZW50LnBhcmVudEVsZW1lbnQpO1xuXG4gICAgICBpZiAoZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50ID09PSAnc2hvd0NvbW1hbmQnKSB7XG4gICAgICAgIHNsaWRlLnJlbmRlclByb21wdCgpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQgPT09ICdleGVjdXRlJykge1xuICAgICAgICBzbGlkZS5yZW5kZXJDb21tYW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBSZXZlYWwuYWRkRXZlbnRMaXN0ZW5lcignc2xpZGVjaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGxldCBzbGlkZSA9IHJ1bkluVGVybWluYWwuZm9yU2VjdGlvbihldmVudC5jdXJyZW50U2xpZGUpO1xuICAgICAgaWYgKHNsaWRlICYmIHNsaWRlLmNsZWFyT25TaG93KSBzbGlkZS5yZW5kZXJQcm9tcHQoKTtcbiAgICAgIHJ1bkluVGVybWluYWwucmVsb2FkKHtleGNlcHQ6IFtzbGlkZV19KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBydW5JblRlcm1pbmFsO1xuICB9XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucykgeyB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9OyB9XG5cbiAgbG9hZCgpIHtcbiAgICBsZXQgc2VjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzZWN0aW9uW2RhdGEtcnVuLWluLXRlcm1pbmFsXScpO1xuICAgIHRoaXMuc2xpZGVzID0gW10ubWFwLmNhbGwoc2VjdGlvbnMsIHNlY3Rpb24gPT4ge1xuICAgICAgcmV0dXJuIG5ldyBTbGlkZShzZWN0aW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVsb2FkKG9wdGlvbnMgPSB7ZXhjZXB0OiBbXX0pIHtcbiAgICB0aGlzLnNsaWRlc1xuICAgICAgLmZpbHRlcihzID0+IG9wdGlvbnMuZXhjZXB0LmluZGV4T2YocykgIT09IC0xKVxuICAgICAgLmZvckVhY2gocyA9PiBzLmxvYWQoKSk7XG4gIH1cblxuICBmb3JTZWN0aW9uKHNlY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy5zbGlkZXMuZmlsdGVyKChzKSA9PiBzLnNlY3Rpb24gPT09IHNlY3Rpb24pWzBdO1xuICB9XG59O1xuIiwiY29uc3QgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChwYXJhbXMsIGZuKSA9PiB7XG4gIGxldCBxcyA9IHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShwYXJhbXMpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoYC9yZXZlYWwtcnVuLWluLXRlcm1pbmFsPyR7cXN9YCk7XG4gICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBlID0+IGZuKEpTT04ucGFyc2UoZS5kYXRhKSkpO1xuICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdkb25lJywgKCkgPT4gcmVzb2x2ZShzb3VyY2UuY2xvc2UoKSkpO1xuICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGUgPT4ge1xuICAgICAgaWYgKGUuZGF0YSkge1xuICAgICAgICBsZXQgbWVzc2FnZXMgPSBKU09OLnBhcnNlKGUuZGF0YSkubWVzc2FnZXM7XG4gICAgICAgIG1lc3NhZ2VzLmZvckVhY2goZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSk7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7bWVzc2FnZXMuam9pbignLCAnKX1gKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG5cbiAgICAgIHNvdXJjZS5jbG9zZSgpO1xuICAgIH0pO1xuICB9KTtcbn07XG4iLCJjb25zdCBydW5Db21tYW5kID0gcmVxdWlyZSgnLi9ydW4tY29tbWFuZCcpO1xuY29uc3QgSGlnaGxpZ2hlciA9IHJlcXVpcmUoJy4vaGlnaGxpZ2hlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Ioc2VjdGlvbiwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zZWN0aW9uID0gc2VjdGlvbjtcblxuICAgIHRoaXMuaGlkZSgpO1xuICAgIHRoaXMuYWRkRWxlbWVudCgnY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLmFkZEVsZW1lbnQoJ3RpdGxlJywge3RhZ05hbWU6ICdzcGFuJywgcGFyZW50OiB0aGlzLmNvbnRhaW5lcn0pO1xuICAgIHRoaXMudGl0bGUuaW5uZXJUZXh0ID0gdGhpcy5zcmM7XG5cbiAgICBbJ2NvZGUnLCAndGVybSddLmZvckVhY2gobmFtZSA9PiB0aGlzLmFkZEVsZW1lbnQobmFtZSwge1xuICAgICAgdGFnTmFtZTogJ3ByZScsXG4gICAgICBjbGFzc2VzOiBbJ2hsanMnXSxcbiAgICAgIHBhcmVudDogdGhpcy5jb250YWluZXJcbiAgICB9KSk7XG5cbiAgICBbJ3Nob3dDb21tYW5kJywgJ2V4ZWN1dGUnXS5mb3JFYWNoKG5hbWUgPT4gdGhpcy5hZGRFbGVtZW50KG5hbWUsIHtcbiAgICAgIGNsYXNzZXM6IFsnZnJhZ21lbnQnXSxcbiAgICAgIGRhdGFzZXQ6IHt0ZXJtaW5hbEZyYWdtZW50OiBuYW1lfVxuICAgIH0pKTtcblxuICAgIHRoaXMubG9hZCgpO1xuICB9XG5cbiAgbG9hZCgpIHtcbiAgICB0aGlzLmhpZGUoKTtcbiAgICByZXR1cm4gZmV0Y2godGhpcy5zcmMpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS50ZXh0KCkpXG4gICAgICAudGhlbihjb2RlID0+IEhpZ2hsaWdoZXIuaGlnaGxpZ2h0KGNvZGUpKVxuICAgICAgLnRoZW4oaHRtbCA9PiB0aGlzLmNvZGUuaW5uZXJIVE1MID0gaHRtbClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5hZGRMaW5lTnVtYmVycygpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAvLyB0aGlzLnJlbmRlclByb21wdCgpO1xuICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgYWRkRWxlbWVudChuYW1lLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzW25hbWVdID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChvcHRpb25zLnRhZ05hbWUgfHwgJ2RpdicpO1xuICAgIChvcHRpb25zLmNsYXNzZXMgfHwgW10pLmNvbmNhdChbbmFtZV0pLmZvckVhY2goY2xhenogPT4ge1xuICAgICAgdGhpc1tuYW1lXS5jbGFzc0xpc3QuYWRkKGNsYXp6KVxuICAgIH0pO1xuICAgIE9iamVjdC5hc3NpZ24odGhpc1tuYW1lXS5kYXRhc2V0LCBvcHRpb25zLmRhdGFzZXQgfHwge30pO1xuXG4gICAgKG9wdGlvbnMucGFyZW50IHx8IHRoaXMuc2VjdGlvbikuYXBwZW5kQ2hpbGQodGhpc1tuYW1lXSk7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV07XG4gIH1cblxuICBhZGRMaW5lTnVtYmVycygpIHtcbiAgICBbXS5mb3JFYWNoLmNhbGwodGhpcy5jb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ2JyJyksIGJyID0+IHtcbiAgICAgIGxldCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKCdsaW5lJyk7XG4gICAgICB0aGlzLmNvZGUuaW5zZXJ0QmVmb3JlKHNwYW4sIGJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNjcm9sbFRvQm90dG9tKCkge1xuICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGxldCB0b3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgKz0gMjtcbiAgICAgIGlmICh0b3AgPT09IHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgIH1cbiAgICB9LCAxKTtcbiAgfVxuXG4gIGhpZGUoKSB7IHRoaXMuc2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XG5cbiAgc2hvdygpIHsgdGhpcy5zZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG5cbiAgcmVuZGVyUHJvbXB0KCkgeyB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gYD4g4paIYDsgfVxuXG4gIHJlbmRlckNvbW1hbmQoKSB7IHRoaXMudGVybS5pbm5lclRleHQgPSBgPiAke3RoaXMuY29tbWFuZH3ilohgOyB9XG5cbiAgZXhlY3V0ZUNvbW1hbmQoKSB7XG4gICAgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGA+ICR7dGhpcy5jb21tYW5kfVxcbmA7XG4gICAgcnVuQ29tbWFuZCh0aGlzLnBhcmFtcywgb3V0cHV0ID0+IHtcbiAgICAgIHRoaXMudGVybS5pbm5lclRleHQgPSBgJHt0aGlzLnRlcm0uaW5uZXJUZXh0LnRyaW0oKX1cXG4ke291dHB1dH1gO1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGAke3RoaXMudGVybS5pbm5lclRleHQudHJpbSgpLnJlcGxhY2UoL+KWiC9nLCAnJyl9XFxuPiDilohgO1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gZXJyLm1lc3NhZ2UpO1xuICB9XG5cbiAgcHJvcGVydHkocHJvcCkgeyByZXR1cm4gdGhpcy5zZWN0aW9uLmRhdGFzZXRbcHJvcF07IH1cblxuICBnZXQgY2xlYXJPblNob3coKSB7XG4gICAgcmV0dXJuICF0aGlzLnNob3dDb21tYW5kLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpO1xuICB9XG5cbiAgZ2V0IGNvbW1hbmQoKSB7XG4gICAgbGV0IGNvbW1hbmQgPSBgJHt0aGlzLmJpbn0gJHt0aGlzLnNyY31gXG4gICAgaWYgKHRoaXMuYXJncykgY29tbWFuZCA9IGAke2NvbW1hbmR9ICR7dGhpcy5hcmdzfWA7XG4gICAgcmV0dXJuIGNvbW1hbmQ7XG4gIH1cblxuICBnZXQgcGFyYW1zKCkge1xuICAgIGxldCBwYXJhbXMgPSB7YmluOiB0aGlzLmJpbiwgc3JjOiB0aGlzLnNyY307XG4gICAgaWYgKHRoaXMuYXJncykgcGFyYW1zLmFyZ3MgPSB0aGlzLmFyZ3M7XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxuXG4gIGdldCBiaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydHkoJ3J1bkluVGVybWluYWxCaW4nKSB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdEJpbjtcbiAgfVxuXG4gIGdldCBzcmMoKSB7IHJldHVybiB0aGlzLnByb3BlcnR5KCdydW5JblRlcm1pbmFsJyk7IH1cblxuICBnZXQgYXJncygpIHsgcmV0dXJuIHRoaXMucHJvcGVydHkoJ3J1bkluVGVybWluYWxBcmdzJyk7IH1cbn07XG4iXX0=
