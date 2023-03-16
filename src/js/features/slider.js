import Flickity from 'flickity';
import FlickityFade from 'flickity-fade';

import {isDesktop} from '../util/media-query';

const selectors = {
  aos: '[data-aos]',
  collectionImage: '.collection-item__image',
  columnImage: '[data-column-image]',
  flickityNextArrow: '.flickity-button.next',
  flickityPrevArrow: '.flickity-button.previous',
  link: 'a:not(.btn)',
  nextArrow: '[data-next-arrow]',
  prevArrow: '[data-prev-arrow]',
  productItemImage: '.product-item__image',
  slide: '[data-slide]',
  slideValue: 'data-slide',
  slider: '[data-slider]',
  sliderThumb: '[data-slider-thumb]',
};

const attributes = {
  arrowPositionMiddle: 'data-arrow-position-middle',
  equalizeHeight: 'data-equalize-height',
  slideIndex: 'data-slide-index',
  sliderOptions: 'data-options',
  slideTextColor: 'data-slide-text-color',
};

const classes = {
  aosAnimate: 'aos-animate',
  desktop: 'desktop',
  focused: 'is-focused',
  flickityResize: 'flickity-resize',
  flickityResizing: 'flickity-resizing',
  flickityEnabled: 'flickity-enabled',
  heroContentTransparent: 'hero__content--transparent',
  initialized: 'is-initialized',
  isLoading: 'is-loading',
  isSelected: 'is-selected',
  mobile: 'mobile',
  sliderInitialized: 'js-slider--initialized',
};

const sections = {};

class Slider {
  constructor(container, slideshow = null) {
    this.container = container;
    this.slideshow = slideshow || this.container.querySelector(selectors.slider);

    if (!this.slideshow) return;

    this.slideshowSlides = this.slideshow.querySelectorAll(selectors.slide);

    if (this.slideshowSlides.length <= 1) return;

    this.sliderPrev = this.container.querySelector(selectors.prevArrow);
    this.sliderNext = this.container.querySelector(selectors.nextArrow);
    this.sliderThumbs = this.container.querySelectorAll(selectors.sliderThumb);
    this.multipleSlides = this.slideshow.hasAttribute(attributes.slidesLargeDesktop);
    this.isHeightEqualized = this.slideshow.getAttribute(attributes.equalizeHeight) === 'true';

    this.sliderCallbackEventOnResize = () => this.sliderCallbackEvent();
    this.addRemoveSlidesForDevicesOnResize = () => this.addRemoveSlidesForDevices();
    this.resetSliderEvent = () => this.resetSlider();

    if (this.slideshow.hasAttribute(attributes.sliderOptions)) {
      this.customOptions = JSON.parse(decodeURIComponent(this.slideshow.getAttribute(attributes.sliderOptions)));
    }

    this.flkty = null;

    this.init();
  }

  init() {
    this.slideshow.classList.add(classes.isLoading);

    this.sliderOptions = {
      contain: true,
      wrapAround: true,
      adaptiveHeight: true,
      ...this.customOptions,
      on: {
        ready: () => {
          requestAnimationFrame(() => {
            this.slideshow.classList.add(classes.initialized);
            this.slideshow.classList.remove(classes.isLoading);
            this.slideshow.parentNode.dispatchEvent(
              new CustomEvent('theme:slider:loaded', {
                bubbles: true,
                detail: {
                  slider: this,
                },
              })
            );
          });

          this.slideActions();

          if (this.sliderOptions.prevNextButtons) {
            this.positionArrows();
          }
        },
        change: (index) => {
          const slide = this.slideshowSlides[index];
          if (!slide || this.sliderOptions.groupCells) return;

          const elementsToAnimate = slide.querySelectorAll(selectors.aos);
          if (elementsToAnimate.length) {
            elementsToAnimate.forEach((el) => {
              el.classList.remove(classes.aosAnimate);
              requestAnimationFrame(() => {
                el.classList.add(classes.aosAnimate);
              });
            });
          }
        },
        resize: () => {
          if (this.sliderOptions.prevNextButtons) {
            this.positionArrows();
          }
        },
      },
    };

    if (this.sliderOptions.fade) {
      this.flkty = new FlickityFade(this.slideshow, this.sliderOptions);
    }

    if (!this.sliderOptions.fade) {
      this.flkty = new Flickity(this.slideshow, this.sliderOptions);
    }

    if (this.isHeightEqualized) {
      this.equalizeHeight();
    }

    if (this.sliderPrev) {
      this.sliderPrev.addEventListener('click', (e) => {
        e.preventDefault();

        this.flkty.previous(true);
      });
    }

    if (this.sliderNext) {
      this.sliderNext.addEventListener('click', (e) => {
        e.preventDefault();

        this.flkty.next(true);
      });
    }

    this.flkty.on('change', () => this.slideActions(true));

    this.addRemoveSlidesForDevices();

    document.addEventListener('theme:resize', this.addRemoveSlidesForDevicesOnResize);

    if (this.multipleSlides) {
      document.addEventListener('theme:resize', this.sliderCallbackEventOnResize);
    }

    if (this.sliderThumbs.length) {
      this.sliderThumbs.forEach((element) => {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          const slideIndex = [...element.parentElement.children].indexOf(element);
          this.flkty.select(slideIndex);
        });
      });
    }

    this.container.addEventListener('theme:tab:change', this.resetSliderEvent);
  }

  // Move slides to their initial position
  resetSlider() {
    if (this.slideshow) {
      if (this.flkty && this.flkty.isActive) {
        this.flkty.select(0, false, true);
      } else {
        this.slideshow.scrollTo({
          left: 0,
          behavior: 'auto',
        });
      }
    }
  }

  addRemoveSlidesForDevices() {
    this.hasDiffSlidesForMobileDesktop =
      Array.prototype.filter.call(this.slideshowSlides, (slide) => {
        if (slide.classList.contains(classes.desktop) || slide.classList.contains(classes.mobile)) {
          return slide;
        }
      }).length > 0;

    if (!this.hasDiffSlidesForMobileDesktop) {
      return;
    }

    let selectorSlides = null;

    if (!isDesktop()) {
      selectorSlides = `${selectors.slide}.${classes.mobile}, ${selectors.slide}:not(.${classes.desktop})`;
    } else {
      selectorSlides = `${selectors.slide}.${classes.desktop}, ${selectors.slide}:not(.${classes.mobile})`;
    }

    this.flkty.options.cellSelector = selectorSlides;
    this.flkty.selectCell(0, false, true);
    this.flkty.reloadCells();
    this.flkty.reposition();
    this.flkty.resize();
    this.slideActions();
  }

  sliderCallbackEvent() {
    if (this.multipleSlides) {
      this.flkty.resize();
      if (!this.slideshow.classList.contains(classes.sliderInitialized)) {
        this.flkty.select(0);
      }
    }
  }

  slideActions(changeEvent = false) {
    const currentSlide = this.slideshow.querySelector(`.${classes.isSelected}`);
    const currentSlideTextColor = currentSlide.getAttribute(attributes.slideTextColor);
    const currentSlideLink = currentSlide.querySelector(selectors.link);
    const buttons = this.slideshow.querySelectorAll(`${selectors.slide} a, ${selectors.slide} button`);

    if (document.body.classList.contains(classes.focused) && currentSlideLink && this.sliderOptions.groupCells && changeEvent) {
      currentSlideLink.focus();
    }

    if (buttons.length) {
      buttons.forEach((button) => {
        const slide = button.closest(selectors.slide);
        if (slide) {
          const tabIndex = slide.classList.contains(classes.isSelected) ? 0 : -1;
          button.setAttribute('tabindex', tabIndex);
        }
      });
    }

    if (currentSlideTextColor !== 'rgba(0,0,0,0)' && currentSlideTextColor !== '') {
      this.slideshow.style.setProperty('--text', currentSlideTextColor);
    }

    if (this.sliderThumbs.length && this.sliderThumbs.length === this.slideshowSlides.length && currentSlide.hasAttribute(attributes.slideIndex)) {
      const slideIndex = parseInt(currentSlide.getAttribute(attributes.slideIndex));
      const currentThumb = this.container.querySelector(`${selectors.sliderThumb}.${classes.isSelected}`);
      if (currentThumb) {
        currentThumb.classList.remove(classes.isSelected);
      }
      this.sliderThumbs[slideIndex].classList.add(classes.isSelected);
    }
  }

  positionArrows() {
    if (this.slideshow.hasAttribute(attributes.arrowPositionMiddle) && this.sliderOptions.prevNextButtons) {
      const itemImage = this.slideshow.querySelector(selectors.collectionImage) || this.slideshow.querySelector(selectors.productItemImage) || this.slideshow.querySelector(selectors.columnImage);

      // Prevent 'clientHeight' of null error if no image
      if (!itemImage) return;

      this.slideshow.querySelector(selectors.flickityPrevArrow).style.top = itemImage.clientHeight / 2 + 'px';
      this.slideshow.querySelector(selectors.flickityNextArrow).style.top = itemImage.clientHeight / 2 + 'px';
    }
  }

  equalizeHeight() {
    Flickity.prototype._createResizeClass = function () {
      requestAnimationFrame(() => {
        this.element.classList.add(classes.flickityResize);
      });
    };

    this.flkty._createResizeClass();

    const resize = Flickity.prototype.resize;
    Flickity.prototype.resize = function () {
      this.element.classList.remove(classes.flickityResize);
      this.element.classList.add(classes.flickityResizing);
      resize.call(this);
      requestAnimationFrame(() => {
        this.element.classList.add(classes.flickityResize);
        this.element.classList.remove(classes.flickityResizing);
      });
    };
  }

  onUnload() {
    if (this.multipleSlides) {
      document.removeEventListener('theme:resize', this.sliderCallbackEventOnResize);
    }

    if (this.slideshow && this.flkty) {
      this.flkty.options.watchCSS = false;
      this.flkty.destroy();
    }

    this.container.removeEventListener('theme:tab:change', this.resetSliderEvent);

    document.removeEventListener('theme:resize', this.addRemoveSlidesForDevicesOnResize);
  }

  onBlockSelect(evt) {
    if (!this.slideshow) return;
    // Ignore the cloned version
    const slide = this.slideshow.querySelector(`[${selectors.slideValue}="${evt.detail.blockId}"]`);

    if (!slide) return;
    let slideIndex = parseInt(slide.getAttribute(attributes.slideIndex));

    if (this.multipleSlides && !this.slideshow.classList.contains(classes.sliderInitialized)) {
      slideIndex = 0;
    }

    this.slideshow.classList.add(classes.isSelected);

    // Go to selected slide, pause autoplay
    if (this.flkty && this.slideshow.classList.contains(classes.flickityEnabled)) {
      this.flkty.selectCell(slideIndex);
      this.flkty.stopPlayer();
    }
  }

  onBlockDeselect() {
    if (!this.slideshow) return;
    this.slideshow.classList.remove(classes.isSelected);

    if (this.flkty && this.sliderOptions.hasOwnProperty('autoPlay') && this.sliderOptions.autoPlay) {
      this.flkty.playPlayer();
    }
  }
}

const slider = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(selectors.slider);
    els.forEach((el) => {
      sections[this.id].push(new Slider(this.container, el));
    });
  },
  onUnload() {
    sections[this.id].forEach((el) => {
      if (typeof el.onUnload === 'function') {
        el.onUnload();
      }
    });
  },
  onBlockSelect(e) {
    sections[this.id].forEach((el) => {
      if (typeof el.onBlockSelect === 'function') {
        el.onBlockSelect(e);
      }
    });
  },
  onBlockDeselect(e) {
    sections[this.id].forEach((el) => {
      if (typeof el.onBlockDeselect === 'function') {
        el.onBlockDeselect(e);
      }
    });
  },
};

export {slider, Slider};
