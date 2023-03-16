import {register} from '../vendor/theme-scripts/theme-sections';
import {Ticker} from '../features/ticker';
import {Slider} from '../features/slider';

const selectors = {
  bar: '[data-bar]',
  barSlide: '[data-slide]',
  frame: '[data-ticker-frame]',
  header: '[data-header-wrapper]',
  slider: '[data-slider]',
  marquee: '[data-marquee]',
  tickerScale: '[data-ticker-scale]',
  tickerText: '[data-ticker-text]',
};

const classes = {
  tickerAnimated: 'ticker--animated',
};

const attributes = {
  slide: 'data-slide',
  stop: 'data-stop',
  style: 'style',
  targetReferrer: 'data-target-referrer',
};

const sections = {};

class Bar {
  constructor(holder) {
    this.barHolder = holder;
    this.locationPath = location.href;

    this.slides = this.barHolder.querySelectorAll(selectors.barSlide);
    this.slider = this.barHolder.querySelector(selectors.slider);
    this.marquee = this.barHolder.querySelector(selectors.marquee);

    this.init();
  }

  init() {
    this.removeAnnouncement();

    if (this.slider) {
      this.initSliders();
    }

    if (this.marquee) {
      this.initTickers(true);
    }

    document.dispatchEvent(new CustomEvent('theme:announcement:init', {bubbles: true}));
  }

  /**
   * Delete announcement which has a target referrer attribute and it is not contained in page URL
   */
  removeAnnouncement() {
    for (let index = 0; index < this.slides.length; index++) {
      const element = this.slides[index];

      if (!element.hasAttribute(attributes.targetReferrer)) {
        continue;
      }

      if (this.locationPath.indexOf(element.getAttribute(attributes.targetReferrer)) === -1 && !window.Shopify.designMode) {
        element.parentNode.removeChild(element);
      }
    }
  }

  /**
   * Init slider
   */
  initSliders() {
    this.slider = new Slider(this.barHolder);

    if (this.slider.flkty) {
      this.slider.flkty.reposition();

      this.barHolder.addEventListener('theme:slider:loaded', () => {
        this.initTickers();
      });
    } else {
      this.initTickers();
    }
  }

  /**
   * Init tickers in sliders
   */
  initTickers(stopClone = false) {
    const frames = this.barHolder.querySelectorAll(selectors.frame);

    frames.forEach((element) => {
      new Ticker(element, stopClone);
    });
  }

  toggleTicker(e, isStopped) {
    const tickerScale = document.querySelector(selectors.tickerScale);
    const element = document.querySelector(`[${attributes.slide}="${e.detail.blockId}"]`);

    if (isStopped && element) {
      tickerScale.setAttribute(attributes.stop, '');
      tickerScale.querySelectorAll(selectors.tickerText).forEach((textHolder) => {
        textHolder.classList.remove(classes.tickerAnimated);
        textHolder.style.transform = `translate3d(${-(element.offsetLeft - element.clientWidth)}px, 0, 0)`;
      });
    }

    if (!isStopped && element) {
      tickerScale.querySelectorAll(selectors.tickerText).forEach((textHolder) => {
        textHolder.classList.add(classes.tickerAnimated);
        textHolder.removeAttribute(attributes.style);
      });
      tickerScale.removeAttribute(attributes.stop);
    }
  }

  onBlockSelect(e) {
    if (this.slider) {
      this.slider.onBlockSelect(e);
    } else {
      this.toggleTicker(e, true);
    }
  }

  onBlockDeselect(e) {
    if (this.slider) {
      this.slider.onBlockDeselect(e);
    } else {
      this.toggleTicker(e, false);
    }
  }
}

const bar = {
  onLoad() {
    sections[this.id] = [];
    const element = this.container.querySelector(selectors.bar);
    if (element) {
      sections[this.id].push(new Bar(element));
    }
  },
  onBlockSelect(e) {
    if (sections[this.id].length) {
      sections[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === 'function') {
          el.onBlockSelect(e);
        }
      });
    }
  },
  onBlockDeselect(e) {
    if (sections[this.id].length) {
      sections[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === 'function') {
          el.onBlockDeselect(e);
        }
      });
    }
  },
};

register('announcement', [bar]);
