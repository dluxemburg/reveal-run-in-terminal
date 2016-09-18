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
