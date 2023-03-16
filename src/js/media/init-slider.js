import FlickityFade from 'flickity-fade';

import {isMobile} from '../util/media-query';

const selectors = {
  productSlideshow: '[data-product-slideshow]',
  mobileSliderDisabled: 'data-slideshow-disabled-mobile',
  productThumbs: '[data-product-thumbs]',
  sliderThumb: '[data-thumb-item]',
  dataTallLayout: 'data-tall-layout',
  mediaType: 'data-type',
  dataMediaId: 'data-media-id',
  dataThumb: 'data-thumb',
  dataThumbIndex: 'data-thumb-index',
  deferredMediaButton: '[data-deferred-media-button]',
  ariaLabel: 'aria-label',
  dataThumbnail: '[data-thumbnail]',
  productSlideThumb: '.js-product-slide-thumb',
  classSelected: '.is-active',
  thumbsSlider: '[data-thumbs-slider]',
  quickAddModal: '[data-quick-add-modal]',
  focusedElement: '[data-focus-element]',
  zoomElement: '[data-zoom-wrapper]',
};

const classes = {
  active: 'is-active',
  focused: 'is-focused',
  dragging: 'is-dragging',
  selected: 'is-selected',
  sliderEnabled: 'flickity-enabled',
  mediaHidden: 'media--hidden',
};

const attributes = {
  ariaCurrent: 'aria-current',
  sliderOptions: 'data-options',
};

const thumbIcons = {
  model:
    '<svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-media-model" viewBox="0 0 26 26"><path class="icon-media-model-outline" d="M.5 25v.5h25V.5H.5z" fill="none"/><path class="icon-media-model-element" d="M19.13 8.28L14 5.32a2 2 0 0 0-2 0l-5.12 3a2 2 0 0 0-1 1.76V16a2 2 0 0 0 1 1.76l5.12 3a2 2 0 0 0 2 0l5.12-3a2 2 0 0 0 1-1.76v-6a2 2 0 0 0-.99-1.72zm-6.4 11.1l-5.12-3a.53.53 0 0 1-.26-.38v-6a.53.53 0 0 1 .27-.46l5.12-3a.53.53 0 0 1 .53 0l5.12 3-4.72 2.68a1.33 1.33 0 0 0-.67 1.2v6a.53.53 0 0 1-.26 0z" opacity=".6" style="isolation:isolate"/></svg>',
  video:
    '<svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-media-video" viewBox="0 0 26 26"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 25h24V1H1v24z"/><path class="icon-media-video-outline" d="M.5 25v.5h25V.5H.5V25z"/><path class="icon-media-video-element" fill-rule="evenodd" clip-rule="evenodd" d="M9.718 6.72a1 1 0 0 0-1.518.855v10.736a1 1 0 0 0 1.562.827l8.35-5.677a1 1 0 0 0-.044-1.682l-8.35-5.06z" opacity=".6"/></svg>',
};

let sections = {};

class InitSlider {
  constructor(section, modalHolder = null) {
    this.container = modalHolder || section.container;
    this.tallLayout = this.container.getAttribute(selectors.dataTallLayout) === 'true';
    this.slideshow = this.container.querySelector(selectors.productSlideshow);
    this.thumbs = this.container.querySelector(selectors.productThumbs);
    this.mobileSliderDisabled = this.container.getAttribute(selectors.mobileSliderDisabled) === 'true';
    this.initSliderMobileEvent = () => this.initSliderMobile();
    this.initSliderDesktopEvent = () => this.initSliderDesktop();

    if (this.slideshow && this.slideshow.hasAttribute(attributes.sliderOptions)) {
      this.customOptions = JSON.parse(decodeURIComponent(this.slideshow.getAttribute(attributes.sliderOptions)));
    }

    this.flkty = null;

    this.init();
  }

  init() {
    if (!this.slideshow) return;

    if (this.tallLayout) {
      if (!this.mobileSliderDisabled) {
        this.initSliderMobile();

        document.addEventListener('theme:resize:width', this.initSliderMobileEvent);
      }
    } else if (this.mobileSliderDisabled) {
      this.initSliderDesktop();

      document.addEventListener('theme:resize:width', this.initSliderDesktopEvent);
    } else {
      this.createSlider();
    }
  }

  initSliderMobile() {
    if (isMobile()) {
      this.createSlider();
    } else {
      this.destroySlider();
    }
  }

  initSliderDesktop() {
    if (isMobile()) {
      this.destroySlider();
    } else {
      this.createSlider();
    }
  }

  destroySlider() {
    const isSliderInitialized = this.slideshow.classList.contains(classes.sliderEnabled);

    if (isSliderInitialized) {
      this.flkty.destroy();
    }

    if (this.thumbs) {
      this.thumbs.innerHTML = '';
    }
  }

  createSlider() {
    if (!this.slideshow || (this.mobileSliderDisabled && isMobile())) {
      return;
    }

    const sliderOptions = {
      autoPlay: false,
      pageDots: false,
      wrapAround: true,
      ...this.customOptions,
    };

    const instance = this;
    const firstSlide = this.slideshow.querySelectorAll(`[${selectors.mediaType}]`)[0];
    let options = {
      ...sliderOptions,
      on: {
        ready: function () {
          const slides = this.element;
          slides.addEventListener('keyup', (e) => {
            if (e.code === window.theme.keyboardKeys.ENTER) {
              const zoomElement = slides.querySelector(`.${classes.selected} ${selectors.zoomElement}`);
              if (zoomElement) {
                zoomElement.dispatchEvent(new Event('click', {bubbles: false}));
                window.accessibility.lastElement = slides;
              }
            }
          });

          instance.sliderThumbs(this);

          instance.accessibilityActions(this);
        },
      },
    };

    this.flkty = new FlickityFade(this.slideshow, options);
    this.flkty.resize();

    if (firstSlide) {
      const firstType = firstSlide.getAttribute(selectors.mediaType);

      if (firstType === 'model' || firstType === 'video' || firstType === 'external_video') {
        this.flkty.options.draggable = false;
        this.flkty.updateDraggable();
      }
    }

    this.flkty.on('change', function (index) {
      let lastSLideIdx = index;

      if (instance.thumbs) {
        const selectedElem = instance.thumbs.querySelector(selectors.classSelected);
        const currentSlide = instance.thumbs.querySelector(`${selectors.sliderThumb} [${selectors.dataThumbIndex}="${index}"]`);

        if (selectedElem) {
          const selectedElemThumb = selectedElem.querySelector(`[${selectors.dataThumbIndex}]`);
          lastSLideIdx = Array.from(selectedElem.parentElement.children).indexOf(selectedElem);
          selectedElem.classList.remove(classes.active);

          if (selectedElemThumb) {
            selectedElemThumb.setAttribute(attributes.ariaCurrent, false);
          }
        }

        if (currentSlide) {
          currentSlide.parentElement.classList.add(classes.active);
          currentSlide.setAttribute(attributes.ariaCurrent, true);
        }

        instance.scrollToThumb();
      }

      const currentMedia = this.cells[lastSLideIdx].element;
      const newMedia = this.selectedElement;

      currentMedia.dispatchEvent(new CustomEvent('theme:media:hidden'));
      newMedia.classList.remove(classes.mediaHidden);
    });

    this.flkty.on('settle', function () {
      const currentMedia = this.selectedElement;
      const otherMedia = Array.prototype.filter.call(currentMedia.parentNode.children, function (child) {
        return child !== currentMedia;
      });
      const mediaType = currentMedia.getAttribute(selectors.mediaType);
      const isFocusEnabled = document.body.classList.contains(classes.focused);

      if (mediaType === 'model' || mediaType === 'video' || mediaType === 'external_video') {
        // fisrt boolean sets value, second option false to prevent refresh
        instance.flkty.options.draggable = false;
        instance.flkty.updateDraggable();
      } else {
        instance.flkty.options.draggable = true;
        instance.flkty.updateDraggable();
      }

      if (isFocusEnabled) currentMedia.dispatchEvent(new Event('focus'));

      if (otherMedia.length) {
        otherMedia.forEach((element) => {
          element.classList.add(classes.mediaHidden);
        });
      }

      currentMedia.dispatchEvent(new CustomEvent('theme:media:visible'));

      // Force media loading if slide becomes visible
      const deferredMedia = currentMedia.querySelector('deferred-media');
      if (deferredMedia && deferredMedia.getAttribute('loaded') !== true) {
        currentMedia.querySelector(selectors.deferredMediaButton).dispatchEvent(new Event('click', {bubbles: false}));
      }

      instance.accessibilityActions(this);
    });

    this.flkty.on('dragStart', (event, pointer) => {
      event.target.classList.add(classes.dragging);
    });

    this.flkty.on('dragEnd', (event, pointer) => {
      const draggedElem = this.flkty.element.querySelector(`.${classes.dragging}`);
      if (draggedElem) {
        draggedElem.classList.remove(classes.dragging);
      }
    });

    this.container.addEventListener('click', (e) => {
      const target = e.target;

      if (target.matches(selectors.productSlideThumb) || target.closest(selectors.productSlideThumb)) {
        e.preventDefault();
        const selector = target.matches(selectors.productSlideThumb) ? target : target.closest(selectors.productSlideThumb);
        const slideIdx = selector.hasAttribute(selectors.dataThumbIndex) ? parseInt(selector.getAttribute(selectors.dataThumbIndex)) : 0;

        this.flkty.select(slideIdx);
      }
    });
  }

  accessibilityActions(slider) {
    const slides = slider.slides;

    if (slides.length) {
      slides.forEach((element) => {
        const slide = element.cells[0].element;
        const focusedElements = slide.querySelectorAll(`model-viewer, video, iframe, button, [href], input, ${selectors.focusedElement}`);

        if (slide.classList.contains(classes.selected)) {
          slide.removeAttribute('tabindex');
        } else {
          slide.setAttribute('tabindex', '-1');
        }

        if (focusedElements.length) {
          focusedElements.forEach((focusedElement) => {
            if (slide.classList.contains(classes.selected)) {
              focusedElement.removeAttribute('tabindex');
            } else {
              focusedElement.setAttribute('tabindex', '-1');
            }
          });
        }
      });
    }
  }

  scrollToThumb() {
    const thumbs = this.container.querySelector(selectors.thumbsSlider);

    if (thumbs) {
      const thumb = thumbs.querySelector(selectors.classSelected);
      if (!thumb) return;
      const thumbsScrollTop = thumbs.scrollTop;
      const thumbsScrollLeft = thumbs.scrollLeft;
      const thumbsWidth = thumbs.offsetWidth;
      const thumbsHeight = thumbs.offsetHeight;
      const thumbsPositionBottom = thumbsScrollTop + thumbsHeight;
      const thumbsPositionRight = thumbsScrollLeft + thumbsWidth;
      const thumbPosTop = thumb.offsetTop;
      const thumbPosLeft = thumb.offsetLeft;
      const thumbWidth = thumb.offsetWidth;
      const thumbHeight = thumb.offsetHeight;
      const thumbRightPos = thumbPosLeft + thumbWidth;
      const thumbBottomPos = thumbPosTop + thumbHeight;
      const topCheck = thumbsScrollTop > thumbPosTop;
      const bottomCheck = thumbBottomPos > thumbsPositionBottom;
      const leftCheck = thumbsScrollLeft > thumbPosLeft;
      const rightCheck = thumbRightPos > thumbsPositionRight;
      const verticalCheck = bottomCheck || topCheck;
      const horizontalCheck = rightCheck || leftCheck;
      const isMobileView = isMobile();

      if (verticalCheck || horizontalCheck) {
        let scrollTopPosition = thumbPosTop - thumbsHeight + thumbHeight;
        let scrollLeftPosition = thumbPosLeft - thumbsWidth + thumbWidth;

        if (topCheck) {
          scrollTopPosition = thumbPosTop;
        }

        if (rightCheck && isMobileView) {
          scrollLeftPosition += parseInt(window.getComputedStyle(thumbs).paddingRight);
        }

        if (leftCheck) {
          scrollLeftPosition = thumbPosLeft;

          if (isMobileView) {
            scrollLeftPosition -= parseInt(window.getComputedStyle(thumbs).paddingLeft);
          }
        }

        thumbs.scrollTo({
          top: scrollTopPosition,
          left: scrollLeftPosition,
          behavior: 'smooth',
        });
      }
    }
  }

  sliderThumbs(thisEl) {
    const slides = thisEl.slides;

    if (this.thumbs && slides.length) {
      let slidesHtml = '';
      slides.forEach((element, i) => {
        const slide = element.cells[0].element;
        const type = slide.getAttribute(selectors.mediaType);
        const mediaId = slide.getAttribute(selectors.dataMediaId);
        const thumb = slide.getAttribute(selectors.dataThumb);
        let thumbAlt = '';
        const thumbIcon = thumbIcons[type] ? thumbIcons[type] : '';
        let selected = '';
        let ariaCurrent = false;

        if (slide.querySelector(`[${selectors.ariaLabel}]`)) {
          thumbAlt = slide.querySelector(`[${selectors.ariaLabel}]`).getAttribute(selectors.ariaLabel);
        }

        if (thumbAlt === '' && slide.hasAttribute(selectors.ariaLabel)) {
          thumbAlt = slide.getAttribute(selectors.ariaLabel);
        }

        if (slide.classList.contains(classes.active) || i === 0) {
          selected = classes.active;
          ariaCurrent = true;
        }

        slidesHtml += `<div class="product__thumb ${selected}" data-thumb-item><a href="${thumb}" class="product__thumb__link product__thumb__link--${type} js-product-slide-thumb" data-thumb-index="${i}" data-thumbnail data-media-id="${mediaId}" aria-label="${thumbAlt}" aria-current="${ariaCurrent}"><img class="product__thumb__link__image" loading="lazy" is="lazy-img" src="${thumb}" sizes="75px" alt="${thumbAlt}">${thumbIcon}</a></div>`;
      });

      if (slidesHtml !== '') {
        slidesHtml = `<div class="product__thumbs__holder" data-thumbs-slider>${slidesHtml}</div>`;
        this.thumbs.innerHTML = slidesHtml;
      }
    }

    const productThumbImages = this.container.querySelectorAll(selectors.dataThumbnail);
    if (productThumbImages.length) {
      productThumbImages.forEach((element) => {
        element.addEventListener('click', function (e) {
          e.preventDefault();
        });

        element.addEventListener('keyup', function (e) {
          // On keypress Enter move the focus to the first focusable element in the related slide
          if (e.code === window.theme.keyboardKeys.ENTER) {
            const mediaId = this.getAttribute(selectors.dataMediaId);
            const mediaElem = thisEl.element
              .querySelector(`[${selectors.dataMediaId}="${mediaId}"]`)
              .querySelectorAll('model-viewer, video, iframe, button, [href], input, [tabindex]:not([tabindex="-1"])')[0];
            if (mediaElem) {
              mediaElem.dispatchEvent(new Event('focus'));
              mediaElem.dispatchEvent(new Event('select'));
            }
          }
        });
      });
    }
  }

  onUnload() {
    if (this.tallLayout) {
      if (!this.mobileSliderDisabled) {
        document.removeEventListener('theme:resize:width', this.initSliderMobileEvent);
      }
    } else if (this.mobileSliderDisabled) {
      document.removeEventListener('theme:resize:width', this.initSliderDesktopEvent);
    }
  }
}

const initSlider = {
  onLoad() {
    sections[this.id] = new InitSlider(this);
  },
  onUnload(e) {
    sections[this.id].onUnload(e);
  },
};

export {initSlider, InitSlider};
