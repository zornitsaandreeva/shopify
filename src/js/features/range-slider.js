const selectors = {
  rangeSlider: '[data-range-slider]',
  rangeDotLeft: '[data-range-left]',
  rangeDotRight: '[data-range-right]',
  rangeLine: '[data-range-line]',
  rangeHolder: '[data-range-holder]',
  dataMin: 'data-se-min',
  dataMax: 'data-se-max',
  dataMinValue: 'data-se-min-value',
  dataMaxValue: 'data-se-max-value',
  dataStep: 'data-se-step',
  dataFilterUpdate: 'data-range-filter-update',
  priceMin: '[data-field-price-min]',
  priceMax: '[data-field-price-max]',
};

const classes = {
  initialized: 'is-initialized',
};

const sections = {};

class RangeSlider {
  constructor(section) {
    this.container = section.container;
    this.slider = section.querySelector(selectors.rangeSlider);
    this.resizeFilters = () => this.init();

    if (this.slider) {
      this.onMoveEvent = (event) => this.onMove(event);
      this.onStopEvent = (event) => this.onStop(event);
      this.onStartEvent = (event) => this.onStart(event);
      this.startX = 0;
      this.x = 0;

      // retrieve touch button
      this.touchLeft = this.slider.querySelector(selectors.rangeDotLeft);
      this.touchRight = this.slider.querySelector(selectors.rangeDotRight);
      this.lineSpan = this.slider.querySelector(selectors.rangeLine);

      // get some properties
      this.min = parseFloat(this.slider.getAttribute(selectors.dataMin));
      this.max = parseFloat(this.slider.getAttribute(selectors.dataMax));

      this.step = 0.0;

      // normalize flag
      this.normalizeFact = 26;

      this.init();
    }
  }

  init() {
    // retrieve default values
    let defaultMinValue = this.min;
    if (this.slider.hasAttribute(selectors.dataMinValue)) {
      defaultMinValue = parseFloat(this.slider.getAttribute(selectors.dataMinValue));
    }
    let defaultMaxValue = this.max;

    if (this.slider.hasAttribute(selectors.dataMaxValue)) {
      defaultMaxValue = parseFloat(this.slider.getAttribute(selectors.dataMaxValue));
    }

    // check values are correct
    if (defaultMinValue < this.min) {
      defaultMinValue = this.min;
    }

    if (defaultMaxValue > this.max) {
      defaultMaxValue = this.max;
    }

    if (defaultMinValue > defaultMaxValue) {
      defaultMinValue = defaultMaxValue;
    }

    if (this.slider.getAttribute(selectors.dataStep)) {
      this.step = Math.abs(parseFloat(this.slider.getAttribute(selectors.dataStep)));
    }

    // initial reset
    this.reset();
    document.addEventListener('theme:resize', this.resizeFilters);

    // usefull values, min, max, normalize fact is the width of both touch buttons
    this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
    this.selectedTouch = null;
    this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;

    // set defualt values
    this.setMinValue(defaultMinValue);
    this.setMaxValue(defaultMaxValue);

    // link events
    this.touchLeft.addEventListener('mousedown', this.onStartEvent);
    this.touchRight.addEventListener('mousedown', this.onStartEvent);
    this.touchLeft.addEventListener('touchstart', this.onStartEvent, {passive: true});
    this.touchRight.addEventListener('touchstart', this.onStartEvent, {passive: true});

    // initialize
    this.slider.classList.add(classes.initialized);
  }

  reset() {
    this.touchLeft.style.left = '0px';
    this.touchRight.style.left = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
    this.lineSpan.style.marginLeft = '0px';
    this.lineSpan.style.width = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
    this.startX = 0;
    this.x = 0;
  }

  setMinValue(minValue) {
    const ratio = (minValue - this.min) / (this.max - this.min);
    this.touchLeft.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact))) + 'px';
    this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
    this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
    this.slider.setAttribute(selectors.dataMinValue, minValue);
  }

  setMaxValue(maxValue) {
    const ratio = (maxValue - this.min) / (this.max - this.min);
    this.touchRight.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact)) + this.normalizeFact) + 'px';
    this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
    this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
    this.slider.setAttribute(selectors.dataMaxValue, maxValue);
  }

  onStart(event) {
    // Prevent default dragging of selected content
    let eventTouch = event;

    if (event.touches) {
      eventTouch = event.touches[0];
    }

    if (event.currentTarget === this.touchLeft) {
      this.x = this.touchLeft.offsetLeft;
    } else if (event.currentTarget === this.touchRight) {
      this.x = this.touchRight.offsetLeft;
    }

    this.startX = eventTouch.pageX - this.x;
    this.selectedTouch = event.currentTarget;
    document.addEventListener('mousemove', this.onMoveEvent);
    document.addEventListener('mouseup', this.onStopEvent);
    document.addEventListener('touchmove', this.onMoveEvent, {passive: true});
    document.addEventListener('touchend', this.onStopEvent, {passive: true});
  }

  onMove(event) {
    let eventTouch = event;

    if (event.touches) {
      eventTouch = event.touches[0];
    }

    this.x = eventTouch.pageX - this.startX;

    if (this.selectedTouch === this.touchLeft) {
      if (this.x > this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10) {
        this.x = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10;
      } else if (this.x < 0) {
        this.x = 0;
      }

      this.selectedTouch.style.left = this.x + 'px';
    } else if (this.selectedTouch === this.touchRight) {
      if (this.x < this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10) {
        this.x = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10;
      } else if (this.x > this.maxX) {
        this.x = this.maxX;
      }
      this.selectedTouch.style.left = this.x + 'px';
    }

    // update line span
    this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
    this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';

    // write new value
    this.calculateValue();

    // call on change
    if (this.slider.getAttribute('on-change')) {
      const fn = new Function('min, max', this.slider.getAttribute('on-change'));
      fn(this.slider.getAttribute(selectors.dataMinValue), this.slider.getAttribute(selectors.dataMaxValue));
    }

    this.onChange(this.slider.getAttribute(selectors.dataMinValue), this.slider.getAttribute(selectors.dataMaxValue));
  }

  onStop() {
    document.removeEventListener('mousemove', this.onMoveEvent);
    document.removeEventListener('mouseup', this.onStopEvent);
    document.removeEventListener('touchmove', this.onMoveEvent);
    document.removeEventListener('touchend', this.onStopEvent);

    this.selectedTouch = null;

    // write new value
    this.calculateValue();

    // call did changed
    this.onChanged(this.slider.getAttribute(selectors.dataMinValue), this.slider.getAttribute(selectors.dataMaxValue));
  }

  onChange(min, max) {
    const rangeHolder = this.slider.closest(selectors.rangeHolder);
    if (rangeHolder) {
      const priceMin = rangeHolder.querySelector(selectors.priceMin);
      const priceMax = rangeHolder.querySelector(selectors.priceMax);

      if (priceMin && priceMax) {
        priceMin.value = min;
        priceMax.value = max;
      }
    }
  }

  onChanged(min, max) {
    if (this.slider.hasAttribute(selectors.dataFilterUpdate)) {
      this.slider.dispatchEvent(new CustomEvent('theme:range:update', {bubbles: true}));
    }
  }

  calculateValue() {
    const newValue = (this.lineSpan.offsetWidth - this.normalizeFact) / this.initialValue;
    let minValue = this.lineSpan.offsetLeft / this.initialValue;
    let maxValue = minValue + newValue;

    minValue = minValue * (this.max - this.min) + this.min;
    maxValue = maxValue * (this.max - this.min) + this.min;

    if (this.step !== 0.0) {
      let multi = Math.floor(minValue / this.step);
      minValue = this.step * multi;

      multi = Math.floor(maxValue / this.step);
      maxValue = this.step * multi;
    }

    if (this.selectedTouch === this.touchLeft) {
      this.slider.setAttribute(selectors.dataMinValue, minValue);
    }

    if (this.selectedTouch === this.touchRight) {
      this.slider.setAttribute(selectors.dataMaxValue, maxValue);
    }
  }

  onUnload() {
    if (this.resizeFilters) {
      document.removeEventListener('theme:resize', this.resizeFilters);
    }
  }
}

const rangeSlider = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(selectors.rangeSlider);
    els.forEach((el) => {
      sections[this.id].push(new RangeSlider(el));
    });
  },
  onUnload: function () {
    sections[this.id].forEach((el) => {
      if (typeof el.unload === 'function') {
        el.unload();
      }
    });
    sections[this.id].onUnload(e);
  },
};

export {rangeSlider, RangeSlider};
