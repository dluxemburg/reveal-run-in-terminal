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
      .then(html => html.replace(/\n/g, '<span class="line"></span>\n'))
      .then(html => this.code.innerHTML = html)
      .then(() => this.container.scrollTop = 0)
      .then(() => this.show());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyIsInNyYy9oaWdobGlnaGVyLmpzIiwic3JjL3JldmVhbC1ydW4taW4tdGVybWluYWwuanMiLCJzcmMvcnVuLWNvbW1hbmQuanMiLCJzcmMvc2xpZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnlQcmltaXRpdmUgPSBmdW5jdGlvbih2KSB7XG4gIHN3aXRjaCAodHlwZW9mIHYpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHY7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB2ID8gJ3RydWUnIDogJ2ZhbHNlJztcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaXNGaW5pdGUodikgPyB2IDogJyc7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgc2VwLCBlcSwgbmFtZSkge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgIG9iaiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBtYXAob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihrKSB7XG4gICAgICB2YXIga3MgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKGspKSArIGVxO1xuICAgICAgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgICByZXR1cm4gbWFwKG9ialtrXSwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUodikpO1xuICAgICAgICB9KS5qb2luKHNlcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9ialtrXSkpO1xuICAgICAgfVxuICAgIH0pLmpvaW4oc2VwKTtcblxuICB9XG5cbiAgaWYgKCFuYW1lKSByZXR1cm4gJyc7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG5hbWUpKSArIGVxICtcbiAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqKSk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZnVuY3Rpb24gbWFwICh4cywgZikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXMucHVzaChmKHhzW2ldLCBpKSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLmRlY29kZSA9IGV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2RlY29kZScpO1xuZXhwb3J0cy5lbmNvZGUgPSBleHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIHtcbiAgc3RhdGljIGhpZ2hsaWdodChjb2RlKSB7XG4gICAgdGhpcy5faW5zdGFuY2UgPSB0aGlzLl9pbnN0YW5jZSB8fCBuZXcgdGhpcygpO1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZS5oaWdobGlnaHQoY29kZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLndvcmtlciA9IG5ldyBXb3JrZXIoJy9wbHVnaW4vcmV2ZWFsLXJ1bi1pbi10ZXJtaW5hbC1obGpzLXdvcmtlci5qcycpO1xuICAgIHRoaXMucGVuZGluZyA9IHt9O1xuICAgIHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgICAgdGhpcy5wZW5kaW5nW2V2ZW50LmRhdGEuY2FsbGJhY2tJZF0ucmVzb2x2ZShldmVudC5kYXRhLmNvZGUudmFsdWUpO1xuICAgICAgZGVsZXRlIHRoaXMucGVuZGluZ1tldmVudC5kYXRhLmNhbGxiYWNrSWRdO1xuICAgIH07XG4gIH1cblxuICBoaWdobGlnaHQoY29kZSkge1xuICAgIGxldCBjYWxsYmFja0lkID0gKERhdGUubm93KCkgKyBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygxNik7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMucGVuZGluZ1tjYWxsYmFja0lkXSA9IHtyZXNvbHZlLCByZWplY3R9O1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe2NhbGxiYWNrSWQsIGNvZGV9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwiY29uc3QgU2xpZGUgPSByZXF1aXJlKCcuL3NsaWRlJyk7XG5cbndpbmRvdy5SdW5JblRlcm1pbmFsID0gY2xhc3Mge1xuICBzdGF0aWMgaW5pdChvcHRpb25zKSB7XG4gICAgbGV0IHJ1bkluVGVybWluYWwgPSBuZXcgdGhpcyhvcHRpb25zKTtcbiAgICBydW5JblRlcm1pbmFsLmxvYWQoKTtcblxuICAgIFJldmVhbC5hZGRFdmVudExpc3RlbmVyKCdmcmFnbWVudHNob3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICghZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50KSByZXR1cm47XG4gICAgICBsZXQgc2xpZGUgPSBydW5JblRlcm1pbmFsLmZvclNlY3Rpb24oZXZlbnQuZnJhZ21lbnQucGFyZW50RWxlbWVudCk7XG5cbiAgICAgIGlmIChldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQgPT09ICdzaG93Q29tbWFuZCcpIHtcbiAgICAgICAgc2xpZGUucmVuZGVyQ29tbWFuZCgpO1xuICAgICAgICBzbGlkZS5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQgPT09ICdleGVjdXRlJykge1xuICAgICAgICBzbGlkZS5leGVjdXRlQ29tbWFuZCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ2ZyYWdtZW50aGlkZGVuJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICghZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50KSByZXR1cm47XG4gICAgICBsZXQgc2xpZGUgPSBydW5JblRlcm1pbmFsLmZvclNlY3Rpb24oZXZlbnQuZnJhZ21lbnQucGFyZW50RWxlbWVudCk7XG5cbiAgICAgIGlmIChldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQgPT09ICdzaG93Q29tbWFuZCcpIHtcbiAgICAgICAgc2xpZGUucmVuZGVyUHJvbXB0KCk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCA9PT0gJ2V4ZWN1dGUnKSB7XG4gICAgICAgIHNsaWRlLnJlbmRlckNvbW1hbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIFJldmVhbC5hZGRFdmVudExpc3RlbmVyKCdzbGlkZWNoYW5nZWQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgbGV0IHNsaWRlID0gcnVuSW5UZXJtaW5hbC5mb3JTZWN0aW9uKGV2ZW50LmN1cnJlbnRTbGlkZSk7XG4gICAgICBpZiAoc2xpZGUgJiYgc2xpZGUuY2xlYXJPblNob3cpIHNsaWRlLnJlbmRlclByb21wdCgpO1xuICAgICAgcnVuSW5UZXJtaW5hbC5yZWxvYWQoe2V4Y2VwdDogW3NsaWRlXX0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJ1bkluVGVybWluYWw7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7IHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307IH1cblxuICBsb2FkKCkge1xuICAgIGxldCBzZWN0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NlY3Rpb25bZGF0YS1ydW4taW4tdGVybWluYWxdJyk7XG4gICAgdGhpcy5zbGlkZXMgPSBbXS5tYXAuY2FsbChzZWN0aW9ucywgc2VjdGlvbiA9PiB7XG4gICAgICByZXR1cm4gbmV3IFNsaWRlKHNlY3Rpb24sIHRoaXMub3B0aW9ucyk7XG4gICAgfSk7XG4gIH1cblxuICByZWxvYWQob3B0aW9ucyA9IHtleGNlcHQ6IFtdfSkge1xuICAgIHRoaXMuc2xpZGVzXG4gICAgICAuZmlsdGVyKHMgPT4gb3B0aW9ucy5leGNlcHQuaW5kZXhPZihzKSAhPT0gLTEpXG4gICAgICAuZm9yRWFjaChzID0+IHMubG9hZCgpKTtcbiAgfVxuXG4gIGZvclNlY3Rpb24oc2VjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnNsaWRlcy5maWx0ZXIoKHMpID0+IHMuc2VjdGlvbiA9PT0gc2VjdGlvbilbMF07XG4gIH1cbn07XG4iLCJjb25zdCBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKHBhcmFtcywgZm4pID0+IHtcbiAgbGV0IHFzID0gcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHBhcmFtcyk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZShgL3JldmVhbC1ydW4taW4tdGVybWluYWw/JHtxc31gKTtcbiAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGUgPT4gZm4oSlNPTi5wYXJzZShlLmRhdGEpKSk7XG4gICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ2RvbmUnLCAoKSA9PiByZXNvbHZlKHNvdXJjZS5jbG9zZSgpKSk7XG4gICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZSA9PiB7XG4gICAgICBpZiAoZS5kYXRhKSB7XG4gICAgICAgIGxldCBtZXNzYWdlcyA9IEpTT04ucGFyc2UoZS5kYXRhKS5tZXNzYWdlcztcbiAgICAgICAgbWVzc2FnZXMuZm9yRWFjaChlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpKTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHttZXNzYWdlcy5qb2luKCcsICcpfWApKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH1cblxuICAgICAgc291cmNlLmNsb3NlKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcbiIsImNvbnN0IHJ1bkNvbW1hbmQgPSByZXF1aXJlKCcuL3J1bi1jb21tYW5kJyk7XG5jb25zdCBIaWdobGlnaGVyID0gcmVxdWlyZSgnLi9oaWdobGlnaGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihzZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnNlY3Rpb24gPSBzZWN0aW9uO1xuXG4gICAgdGhpcy5oaWRlKCk7XG4gICAgdGhpcy5hZGRFbGVtZW50KCdjb250YWluZXInKTtcblxuICAgIHRoaXMuYWRkRWxlbWVudCgndGl0bGUnLCB7dGFnTmFtZTogJ3NwYW4nLCBwYXJlbnQ6IHRoaXMuY29udGFpbmVyfSk7XG4gICAgdGhpcy50aXRsZS5pbm5lclRleHQgPSB0aGlzLnNyYztcblxuICAgIFsnY29kZScsICd0ZXJtJ10uZm9yRWFjaChuYW1lID0+IHRoaXMuYWRkRWxlbWVudChuYW1lLCB7XG4gICAgICB0YWdOYW1lOiAncHJlJyxcbiAgICAgIGNsYXNzZXM6IFsnaGxqcyddLFxuICAgICAgcGFyZW50OiB0aGlzLmNvbnRhaW5lclxuICAgIH0pKTtcblxuICAgIFsnc2hvd0NvbW1hbmQnLCAnZXhlY3V0ZSddLmZvckVhY2gobmFtZSA9PiB0aGlzLmFkZEVsZW1lbnQobmFtZSwge1xuICAgICAgY2xhc3NlczogWydmcmFnbWVudCddLFxuICAgICAgZGF0YXNldDoge3Rlcm1pbmFsRnJhZ21lbnQ6IG5hbWV9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5sb2FkKCk7XG4gIH1cblxuICBsb2FkKCkge1xuICAgIHRoaXMuaGlkZSgpO1xuICAgIHJldHVybiBmZXRjaCh0aGlzLnNyYylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLnRleHQoKSlcbiAgICAgIC50aGVuKGNvZGUgPT4gSGlnaGxpZ2hlci5oaWdobGlnaHQoY29kZSkpXG4gICAgICAudGhlbihodG1sID0+IGh0bWwucmVwbGFjZSgvXFxuL2csICc8c3BhbiBjbGFzcz1cImxpbmVcIj48L3NwYW4+XFxuJykpXG4gICAgICAudGhlbihodG1sID0+IHRoaXMuY29kZS5pbm5lckhUTUwgPSBodG1sKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuc2hvdygpKTtcbiAgfVxuXG4gIGFkZEVsZW1lbnQobmFtZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdGhpc1tuYW1lXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQob3B0aW9ucy50YWdOYW1lIHx8ICdkaXYnKTtcbiAgICAob3B0aW9ucy5jbGFzc2VzIHx8IFtdKS5jb25jYXQoW25hbWVdKS5mb3JFYWNoKGNsYXp6ID0+IHtcbiAgICAgIHRoaXNbbmFtZV0uY2xhc3NMaXN0LmFkZChjbGF6eilcbiAgICB9KTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXNbbmFtZV0uZGF0YXNldCwgb3B0aW9ucy5kYXRhc2V0IHx8IHt9KTtcblxuICAgIChvcHRpb25zLnBhcmVudCB8fCB0aGlzLnNlY3Rpb24pLmFwcGVuZENoaWxkKHRoaXNbbmFtZV0pO1xuICAgIHJldHVybiB0aGlzW25hbWVdO1xuICB9XG5cbiAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgbGV0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgbGV0IHRvcCA9IHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcDtcbiAgICAgIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCArPSAyO1xuICAgICAgaWYgKHRvcCA9PT0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH0sIDEpO1xuICB9XG5cbiAgaGlkZSgpIHsgdGhpcy5zZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH1cblxuICBzaG93KCkgeyB0aGlzLnNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cblxuICByZW5kZXJQcm9tcHQoKSB7IHRoaXMudGVybS5pbm5lclRleHQgPSBgPiDilohgOyB9XG5cbiAgcmVuZGVyQ29tbWFuZCgpIHsgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGA+ICR7dGhpcy5jb21tYW5kfeKWiGA7IH1cblxuICBleGVjdXRlQ29tbWFuZCgpIHtcbiAgICB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gYD4gJHt0aGlzLmNvbW1hbmR9XFxuYDtcbiAgICBydW5Db21tYW5kKHRoaXMucGFyYW1zLCBvdXRwdXQgPT4ge1xuICAgICAgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGAke3RoaXMudGVybS5pbm5lclRleHQudHJpbSgpfVxcbiR7b3V0cHV0fWA7XG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gYCR7dGhpcy50ZXJtLmlubmVyVGV4dC50cmltKCkucmVwbGFjZSgv4paIL2csICcnKX1cXG4+IOKWiGA7XG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHRoaXMudGVybS5pbm5lclRleHQgPSBlcnIubWVzc2FnZSk7XG4gIH1cblxuICBwcm9wZXJ0eShwcm9wKSB7IHJldHVybiB0aGlzLnNlY3Rpb24uZGF0YXNldFtwcm9wXTsgfVxuXG4gIGdldCBjbGVhck9uU2hvdygpIHtcbiAgICByZXR1cm4gIXRoaXMuc2hvd0NvbW1hbmQuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aXNpYmxlJyk7XG4gIH1cblxuICBnZXQgY29tbWFuZCgpIHtcbiAgICBsZXQgY29tbWFuZCA9IGAke3RoaXMuYmlufSAke3RoaXMuc3JjfWBcbiAgICBpZiAodGhpcy5hcmdzKSBjb21tYW5kID0gYCR7Y29tbWFuZH0gJHt0aGlzLmFyZ3N9YDtcbiAgICByZXR1cm4gY29tbWFuZDtcbiAgfVxuXG4gIGdldCBwYXJhbXMoKSB7XG4gICAgbGV0IHBhcmFtcyA9IHtiaW46IHRoaXMuYmluLCBzcmM6IHRoaXMuc3JjfTtcbiAgICBpZiAodGhpcy5hcmdzKSBwYXJhbXMuYXJncyA9IHRoaXMuYXJncztcbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG5cbiAgZ2V0IGJpbigpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wZXJ0eSgncnVuSW5UZXJtaW5hbEJpbicpIHx8IHRoaXMub3B0aW9ucy5kZWZhdWx0QmluO1xuICB9XG5cbiAgZ2V0IHNyYygpIHsgcmV0dXJuIHRoaXMucHJvcGVydHkoJ3J1bkluVGVybWluYWwnKTsgfVxuXG4gIGdldCBhcmdzKCkgeyByZXR1cm4gdGhpcy5wcm9wZXJ0eSgncnVuSW5UZXJtaW5hbEFyZ3MnKTsgfVxufTtcbiJdfQ==
