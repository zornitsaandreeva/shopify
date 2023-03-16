import {register} from '../vendor/theme-scripts/theme-sections';
import {QuickAddProduct} from '../features/quick-add-product';
import {swatchGridSection} from '../features/swatch';
import {siblings} from '../features/siblings';
import blockScroll from '../features/block-scroll';
import {isMobile} from '../util/media-query';

const selectors = {
  slider: '[data-slider-mobile]',
  slide: '[data-slide]',
  thumb: '[data-slider-thumb]',
  sliderContainer: '[data-slider-container]',
  popupContainer: '[data-popup-container]',
  popupContent: '[data-popup-content]',
  popupClose: '[data-popup-close]',
  headerSticky: '[data-header-sticky]',
  headerHeight: '[data-header-height]',
};

const classes = {
  isAnimating: 'is-animating',
  isSelected: 'is-selected',
  isOpen: 'is-open',
};

const attributes = {
  thumbValue: 'data-slider-thumb',
};

const sections = {};

class Look {
  constructor(section) {
    this.container = section.container;
    this.slider = this.container.querySelector(selectors.slider);
    this.slides = this.container.querySelectorAll(selectors.slide);
    this.thumbs = this.container.querySelectorAll(selectors.thumb);
    this.popupContainer = this.container.querySelector(selectors.popupContainer);
    this.popupContent = this.container.querySelector(selectors.popupContent);
    this.popupClose = this.container.querySelectorAll(selectors.popupClose);

    this.init();
  }

  init() {
    if (this.slider && this.slides.length && this.thumbs.length) {
      this.popupContainer.addEventListener('transitionend', () => {
        this.popupContainer.classList.remove(classes.isAnimating);
      });

      this.popupContainer.addEventListener('transitionstart', () => {
        this.popupContainer.classList.add(classes.isAnimating);
      });

      this.popupClose.forEach((button) => {
        button.addEventListener('click', () => {
          this.popupContainer.classList.remove(classes.isOpen);
          this.scrollUnlock();
        });
      });

      this.thumbs.forEach((thumb, i) => {
        thumb.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = thumb.hasAttribute(attributes.thumbValue) && thumb.getAttribute(attributes.thumbValue) !== '' ? parseInt(thumb.getAttribute(attributes.thumbValue)) : i;
          const slide = this.slides[idx];
          if (isMobile()) {
            const parentPadding = parseInt(window.getComputedStyle(this.slider).paddingLeft);
            const slideLeft = slide.offsetLeft;
            this.slider.scrollTo({
              top: 0,
              left: slideLeft - parentPadding,
              behavior: 'auto',
            });
            this.scrollLock();
            this.popupContainer.classList.add(classes.isAnimating, classes.isOpen);
          } else {
            const headerHeight =
              document.querySelector(selectors.headerSticky) && document.querySelector(selectors.headerHeight) ? document.querySelector(selectors.headerHeight).getBoundingClientRect().height : 0;
            const slideTop = slide.getBoundingClientRect().top;
            const slideHeightHalf = slide.offsetHeight / 2;
            const windowHeight = window.innerHeight;
            const windowHeightHalf = windowHeight / 2;
            const sliderContainer = this.container.querySelector(selectors.sliderContainer);
            let scrollTarget = slideTop + slideHeightHalf - windowHeightHalf + window.scrollY;

            if (sliderContainer) {
              const sliderContainerTop = sliderContainer.getBoundingClientRect().top + window.scrollY;
              const sliderContainerHeight = sliderContainer.offsetHeight;
              const sliderContainerBottom = sliderContainerTop + sliderContainerHeight;

              if (scrollTarget < sliderContainerTop) {
                scrollTarget = sliderContainerTop - headerHeight;
              } else if (scrollTarget + windowHeight > sliderContainerBottom) {
                scrollTarget = sliderContainerBottom - windowHeight;
              }
            }

            window.scrollTo({
              top: scrollTarget,
              left: 0,
              behavior: 'smooth',
            });
          }
        });
      });
    }
  }

  scrollLock() {
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.slider}));
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupContent}));
  }

  scrollUnlock() {
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }
}

const lookSection = {
  onLoad() {
    sections[this.id] = new Look(this);
  },
};

register('look', [lookSection, swatchGridSection, siblings, blockScroll]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
