import FlickityFade from 'flickity-fade';
import Flickity from 'flickity';

import {register} from '../vendor/theme-scripts/theme-sections';
import blockScroll from '../features/block-scroll';
import {getWindowWidth} from '../util/media-query';

const sections = {};

const selectors = {
  sliderLogos: '[data-slider-logos]',
  sliderText: '[data-slider-text]',
  slide: '[data-slide]',
  slideIndex: '[data-slide-index]',
};

const classes = {
  isSelected: 'is-selected',
  flickityEnabled: 'flickity-enabled',
};

const attributes = {
  slideData: 'data-slide',
  slideIndex: 'data-slide-index',
};

class LogoList {
  constructor(section) {
    this.container = section.container;
    this.slideshowNav = this.container.querySelector(selectors.sliderLogos);
    this.slideshowText = this.container.querySelector(selectors.sliderText);
    this.setSlideshowNavStateOnResize = () => this.setSlideshowNavState();
    this.flkty = null;
    this.flktyNav = null;

    this.initSlideshowText();
    this.initSlideshowNav();
  }

  initSlideshowText() {
    if (!this.slideshowText) return;

    this.flkty = new FlickityFade(this.slideshowText, {
      fade: true,
      autoPlay: false,
      prevNextButtons: false,
      cellAlign: 'left', // Prevents blurry text on Safari
      contain: true,
      pageDots: false,
      wrapAround: false,
      selectedAttraction: 0.2,
      friction: 0.6,
      draggable: false,
      accessibility: false,
      on: {
        ready: () => this.sliderAccessibility(),
        change: () => this.sliderAccessibility(),
      },
    });

    const textSlides = this.slideshowText.querySelectorAll(selectors.slide);
    if (textSlides.length) {
      let maxHeight = -1;
      textSlides.forEach((element) => {
        const elementHeight = parseFloat(getComputedStyle(element, null).height.replace('px', ''));

        if (elementHeight > maxHeight) {
          maxHeight = elementHeight;
        }
      });

      textSlides.forEach((element) => {
        const elementHeight = parseFloat(getComputedStyle(element, null).height.replace('px', ''));

        if (elementHeight < maxHeight) {
          const calculateMargin = Math.ceil((maxHeight - elementHeight) / 2);
          element.style.margin = `${calculateMargin}px 0`;
        }
      });
    }
  }

  sliderAccessibility() {
    const buttons = this.slideshowText.querySelectorAll(`${selectors.slide} a, ${selectors.slide} button`);

    if (buttons.length) {
      buttons.forEach((button) => {
        const slide = button.closest(selectors.slide);
        if (slide) {
          const tabIndex = slide.classList.contains(classes.isSelected) ? 0 : -1;
          button.setAttribute('tabindex', tabIndex);
        }
      });
    }
  }

  initSlideshowNav() {
    if (!this.slideshowNav) return;

    this.logoSlides = this.slideshowNav.querySelectorAll(selectors.slideIndex);

    if (this.logoSlides.length) {
      this.logoSlides.forEach((logoItem) => {
        logoItem.addEventListener('click', (e) => {
          e.preventDefault();

          const index = parseInt(logoItem.getAttribute(attributes.slideIndex));
          const hasSlider = this.slideshowNav.classList.contains(classes.flickityEnabled);

          if (this.flkty) {
            this.flkty.select(index);
          }

          if (hasSlider) {
            this.flktyNav.select(index);
            if (!this.slideshowNav.classList.contains(classes.isSelected)) {
              this.flktyNav.playPlayer();
            }
          } else {
            const selectedSlide = this.slideshowNav.querySelector(`.${classes.isSelected}`);
            if (selectedSlide) {
              selectedSlide.classList.remove(classes.isSelected);
            }
            logoItem.classList.add(classes.isSelected);
          }
        });
      });
    }

    this.setSlideshowNavState();

    document.addEventListener('theme:resize', this.setSlideshowNavStateOnResize);
  }

  setSlideshowNavState() {
    const slides = this.slideshowNav.querySelectorAll(selectors.slide);
    const slidesCount = slides.length;
    const slideWidth = 200;
    const slidesWidth = slidesCount * slideWidth;
    const sliderInitialized = this.slideshowNav.classList.contains(classes.flickityEnabled);

    if (slidesWidth > getWindowWidth()) {
      if (!sliderInitialized) {
        const selectedSlide = this.slideshowNav.querySelector(`.${classes.isSelected}`);
        if (selectedSlide) {
          selectedSlide.classList.remove(classes.isSelected);
        }
        slides[0].classList.add(classes.isSelected);

        this.flktyNav = new Flickity(this.slideshowNav, {
          autoPlay: 4000,
          prevNextButtons: false,
          contain: false,
          pageDots: false,
          wrapAround: true,
          watchCSS: true,
          selectedAttraction: 0.05,
          friction: 0.8,
          initialIndex: 0,
        });

        if (this.flkty) {
          this.flkty.select(0);

          this.flktyNav.on('change', (index) => this.flkty.select(index));
        }
      }
    } else if (sliderInitialized) {
      this.flktyNav.destroy();
      slides[0].classList.add(classes.isSelected);

      if (this.flkty) {
        this.flkty.select(0);
      }
    }
  }

  onBlockSelect(evt) {
    if (!this.slideshowNav) return;
    const slide = this.slideshowNav.querySelector(`[${attributes.slideData}="${evt.detail.blockId}"]`);
    const slideIndex = parseInt(slide.getAttribute(attributes.slideIndex));

    if (this.slideshowNav.classList.contains(classes.flickityEnabled)) {
      this.flktyNav.select(slideIndex);
      this.flktyNav.stopPlayer();
      this.slideshowNav.classList.add(classes.isSelected);
    } else {
      slide.dispatchEvent(new Event('click'));
    }
  }

  onBlockDeselect() {
    if (this.slideshowNav && this.slideshowNav.classList.contains(classes.flickityEnabled)) {
      this.flktyNav.playPlayer();
      this.slideshowNav.classList.remove(classes.isSelected);
    }
  }

  onUnload() {
    if (!this.slideshowNav) return;
    const sliderInitialized = this.slideshowNav.classList.contains(classes.flickityEnabled);
    if (sliderInitialized) {
      this.flktyNav.destroy();
    }

    if (this.flkty) {
      this.flkty.destroy();
    }

    document.removeEventListener('theme:resize', this.setSlideshowNavStateOnResize);
  }
}

const LogoListSection = {
  onLoad() {
    sections[this.id] = new LogoList(this);
  },
  onUnload(e) {
    sections[this.id].onUnload(e);
  },
  onBlockSelect(e) {
    sections[this.id].onBlockSelect(e);
  },
  onBlockDeselect(e) {
    sections[this.id].onBlockDeselect(e);
  },
};

register('logos', [LogoListSection, blockScroll]);
