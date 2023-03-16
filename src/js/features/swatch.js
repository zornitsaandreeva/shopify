import {getUrlWithVariant} from '../vendor/theme-scripts/theme-product-form';
import {fetchProduct} from '../util/fetch-product';
import loadScript from '../util/loader';

import Tooltip from './tooltip';
import NativeScrollbar from './native-scrollbar';

const defaults = {
  color: 'ash',
};

const selectors = {
  gridSwatchForm: '[data-grid-swatch-form]',
  swatch: 'data-swatch',
  outerGrid: '[data-product-grid-item]',
  slide: '[data-product-image]',
  image: 'data-swatch-image',
  sectionId: '[data-section-id]',
  productInfo: '[data-product-information]',
  variant: 'data-swatch-variant',
  variantName: 'data-swatch-variant-name',
  variantTitle: 'data-variant-title',
  button: '[data-swatch-button]',
  swatchLink: '[data-swatch-link]',
  wrapper: '[data-grid-swatches]',
  template: '[data-swatch-template]',
  handle: 'data-swatch-handle',
  label: 'data-swatch-label',
  input: '[data-swatch-input]',
  tooltip: 'data-tooltip',
  swatchCount: 'data-swatch-count',
  scrollbar: 'data-scrollbar',
};

const classes = {
  visible: 'is-visible',
  stopEvents: 'no-events',
};

class ColorMatch {
  constructor(options = {}) {
    this.settings = {
      ...defaults,
      ...options,
    };

    this.match = this.init();
  }

  getColor() {
    return this.match;
  }

  init() {
    const getColors = loadScript({json: window.theme.assets.swatches});
    return getColors
      .then((colors) => {
        return this.matchColors(colors, this.settings.color);
      })
      .catch((e) => {
        console.log('failed to load swatch colors script');
        console.log(e);
      });
  }

  matchColors(colors, name) {
    let bg = '#E5E5E5';
    let img = null;
    const path = window.theme.assets.base || '/';
    const comparisonName = name.toLowerCase().replace(/\s/g, '');
    const array = colors.colors;

    if (array) {
      let indexArray = null;

      const hexColorArr = array.filter((colorObj, index) => {
        const neatName = Object.keys(colorObj).toString().toLowerCase().replace(/\s/g, '');

        if (neatName === comparisonName) {
          indexArray = index;

          return colorObj;
        }
      });

      if (hexColorArr.length && indexArray !== null) {
        const value = Object.values(array[indexArray])[0];
        bg = value;

        if (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.svg')) {
          img = `${path}${value}`;
          bg = '#888888';
        }
      }
    }

    return {
      color: this.settings.color,
      path: img,
      hex: bg,
    };
  }
}

class Swatch {
  constructor(element) {
    this.element = element;
    this.colorString = element.getAttribute(selectors.swatch);
    this.image = element.getAttribute(selectors.image);
    this.variant = element.getAttribute(selectors.variant);
    this.variantName = element.getAttribute(selectors.variantName);
    this.tooltip = this.element.closest(`[${selectors.tooltip}]`);

    const matcher = new ColorMatch({color: this.colorString});
    matcher.getColor().then((result) => {
      this.colorMatch = result;
      this.init();
    });
  }

  init() {
    this.setStyles();
    if (this.variant) {
      this.handleEvents();
    }

    if (this.tooltip) {
      new Tooltip(this.tooltip);
    }
  }

  setStyles() {
    if (this.colorMatch.hex) {
      this.element.style.setProperty('--swatch', `${this.colorMatch.hex}`);
    }
    if (this.colorMatch.path) {
      this.element.style.setProperty('background-image', `url(${this.colorMatch.path})`);
      this.element.style.setProperty('background-size', 'cover');
      this.element.style.setProperty('background-position', 'center center');
    }
  }

  handleEvents() {
    this.outer = this.element.closest(selectors.outerGrid);
    if (this.outer) {
      this.slide = this.outer.querySelector(selectors.slide);
      this.button = this.element.closest(selectors.button);
      this.imagesHidden = this.outer.querySelectorAll(`[${selectors.variantTitle}][style*="display: none;"]`);
      this.outerHoverEvent = () => this.showHoverImages();
      this.outerLeaveEvent = () => this.hideHoverImages();

      if (this.button.closest(selectors.gridSwatchForm)) {
        this.button.addEventListener(
          'mouseenter',
          function () {
            this.changeImage();
          }.bind(this)
        );
      }

      if (this.imagesHidden.length) {
        this.outer.addEventListener('mouseenter', this.outerHoverEvent);
        this.outer.addEventListener('mouseleave', this.outerLeaveEvent);
      }
    }
  }

  showHoverImages() {
    this.imagesHidden.forEach((image) => {
      image.style.removeProperty('display');
    });

    this.outer.removeEventListener('mouseenter', this.outerHoverEvent);
  }

  hideHoverImages() {
    this.slide.querySelectorAll(`.${classes.visible}`)?.forEach((image) => {
      image.classList.remove(classes.visible);
    });
  }

  changeImage() {
    if (this.image) {
      const variantName = this.variantName.replaceAll('"', "'");
      const imageTarget = this.slide.querySelector(`[${selectors.variantTitle}="${variantName}"]`);

      if (imageTarget) {
        const imageVisible = this.slide.querySelector(`[${selectors.variantTitle}].${classes.visible}`);
        if (imageVisible) {
          imageVisible.classList.remove(classes.visible);
        }

        imageTarget.classList.add(classes.visible);
      }
    }
  }
}

class GridSwatch {
  constructor(wrap, container) {
    this.container = container;
    this.wrap = wrap;
    this.outerGrid = wrap.closest(selectors.outerGrid);
    this.productInfo = wrap.closest(selectors.productInfo);
    this.template = document.querySelector(selectors.template).innerHTML;
    this.handle = wrap.getAttribute(selectors.handle);
    this.sectionId = this.wrap.closest(selectors.sectionId).dataset.sectionId;

    const label = wrap.getAttribute(selectors.label).trim().toLowerCase();
    fetchProduct(this.handle).then((product) => {
      this.product = product;
      this.colorOption = product.options.find(function (element) {
        return element.name.toLowerCase() === label || null;
      });

      if (this.colorOption) {
        this.swatches = this.colorOption.values;
        this.init();
      }
    });
  }

  init() {
    this.wrap.innerHTML = '';
    this.count = 0;
    this.swatches.forEach((swatch) => {
      let variant = null;
      let variantAvailable = false;
      let image = '';

      for (const productVariant of this.product.variants) {
        const optionWithSwatch = productVariant.options.includes(swatch);

        if (!variant && optionWithSwatch) {
          variant = productVariant;
        }

        // Use a variant with image if exists
        if (optionWithSwatch && productVariant.featured_media) {
          image = productVariant.featured_media.preview_image.src;
          variant = productVariant;
          break;
        }
      }

      for (const productVariant of this.product.variants) {
        const optionWithSwatch = productVariant.options.includes(swatch);

        if (optionWithSwatch && productVariant.available) {
          variantAvailable = true;
          break;
        }
      }

      if (variant) {
        const swatchTemplate = document.createElement('div');
        swatchTemplate.innerHTML = this.template;
        const button = swatchTemplate.querySelector(selectors.button);
        const swatchLink = swatchTemplate.querySelector(selectors.swatchLink);
        const variantTitle = variant.title.replaceAll('"', "'");

        button.style = `--animation-delay: ${(100 * this.count) / 1000}s`;
        button.dataset.tooltip = swatch;
        swatchLink.href = getUrlWithVariant(this.product.url, variant.id);
        swatchLink.innerText = swatch;
        swatchLink.dataset.swatch = swatch;
        swatchLink.dataset.swatchVariant = variant.id;
        swatchLink.dataset.swatchVariantName = variantTitle;
        swatchLink.dataset.swatchImage = image;
        swatchLink.dataset.variant = variant.id;
        swatchLink.disabled = !variantAvailable;

        this.wrap.innerHTML += swatchTemplate.innerHTML;
        this.count++;
      }
    });

    this.swatchCount = this.productInfo.querySelector(`[${selectors.swatchCount}]`);
    this.swatchElements = this.wrap.querySelectorAll(selectors.swatchLink);
    this.swatchForm = this.productInfo.querySelector(selectors.gridSwatchForm);
    this.hideSwatchesTimer = 0;

    if (this.swatchCount.hasAttribute(selectors.swatchCount)) {
      this.swatchCount.innerText = `${this.count} ${this.count > 1 ? theme.strings.otherColor : theme.strings.oneColor}`;

      this.swatchCount.addEventListener('mouseenter', () => {
        if (this.hideSwatchesTimer) clearTimeout(this.hideSwatchesTimer);

        this.productInfo.classList.add(classes.stopEvents);
        this.swatchForm.classList.add(classes.visible);
      });

      // Prevent color swatches blinking on mouse move
      this.productInfo.addEventListener('mouseleave', () => {
        this.hideSwatchesTimer = setTimeout(() => {
          this.productInfo.classList.remove(classes.stopEvents);
          this.swatchForm.classList.remove(classes.visible);
        }, 100);
      });
    }

    if (this.wrap.hasAttribute(selectors.scrollbar)) {
      new NativeScrollbar(this.wrap);
    }

    this.swatchElements.forEach((el) => {
      new Swatch(el);
    });
  }
}

const makeGridSwatches = (section) => {
  const gridSwatchWrappers = section.container.querySelectorAll(selectors.wrapper);
  gridSwatchWrappers.forEach((wrap) => {
    new GridSwatch(wrap, this);
  });
};

const swatchSection = {
  onLoad() {
    this.swatches = [];
    const els = this.container.querySelectorAll(`[${selectors.swatch}]`);
    els.forEach((el) => {
      this.swatches.push(new Swatch(el));
    });
  },
};

const swatchGridSection = {
  onLoad() {
    makeGridSwatches(this);
  },
};

export {swatchGridSection, swatchSection, makeGridSwatches, Swatch};
