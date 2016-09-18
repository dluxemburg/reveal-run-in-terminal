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
