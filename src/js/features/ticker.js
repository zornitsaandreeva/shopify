import debounce from '../util/debounce';

const selectors = {
  frame: '[data-ticker-frame]',
  scale: '[data-ticker-scale]',
  text: '[data-ticker-text]',
  clone: 'data-clone',
};

const attributes = {
  speed: 'data-marquee-speed',
};

const classes = {
  animation: 'ticker--animated',
  unloaded: 'ticker--unloaded',
  comparitor: 'ticker__comparitor',
};

const settings = {
  textAnimationTime: 1.63, // 100px going to move for 1.63s
  space: 100, // 100px
};

const sections = {};

class Ticker {
  constructor(el, stopClone = false) {
    this.frame = el;
    this.stopClone = stopClone;
    this.scale = this.frame.querySelector(selectors.scale);
    this.text = this.frame.querySelector(selectors.text);

    this.comparitor = this.text.cloneNode(true);
    this.comparitor.classList.add(classes.comparitor);
    this.frame.appendChild(this.comparitor);
    this.scale.classList.remove(classes.unloaded);
    this.resizeEvent = debounce(() => this.checkWidth(), 100);
    this.listen();
  }

  unload() {
    document.removeEventListener('theme:resize', this.resizeEvent);
  }

  listen() {
    document.addEventListener('theme:resize', this.resizeEvent);
    this.checkWidth();
  }

  checkWidth() {
    const padding = window.getComputedStyle(this.frame).paddingLeft.replace('px', '') * 2;
    const speed = this.frame.getAttribute(attributes.speed) ? this.frame.getAttribute(attributes.speed) : settings.textAnimationTime;

    if (this.frame.clientWidth - padding < this.comparitor.clientWidth || this.stopClone) {
      this.text.classList.add(classes.animation);
      if (this.scale.childElementCount === 1) {
        this.clone = this.text.cloneNode(true);
        this.clone.setAttribute(selectors.clone, '');
        this.scale.appendChild(this.clone);

        if (this.stopClone) {
          for (let index = 0; index < 10; index++) {
            const cloneSecond = this.text.cloneNode(true);
            cloneSecond.setAttribute(selectors.clone, '');
            this.scale.appendChild(cloneSecond);
          }
        }

        const animationTimeFrame = ((this.text.clientWidth / settings.space) * Number(speed)).toFixed(2);

        this.scale.style.setProperty('--animation-time', `${animationTimeFrame}s`);
      }
    } else {
      this.text.classList.add(classes.animation);
      let clone = this.scale.querySelector(`[${selectors.clone}]`);
      if (clone) {
        this.scale.removeChild(clone);
      }
      this.text.classList.remove(classes.animation);
    }
  }
}

const ticker = {
  onLoad() {
    sections[this.id] = [];
    const el = this.container.querySelectorAll(selectors.frame);
    el.forEach((el) => {
      sections[this.id].push(new Ticker(el));
    });
  },
  onUnload() {
    sections[this.id].forEach((el) => {
      if (typeof el.unload === 'function') {
        el.unload();
      }
    });
  },
};

export {ticker, Ticker};
