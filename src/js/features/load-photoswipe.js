import loadScript from '../util/loader';
import * as a11y from '../vendor/theme-scripts/theme-a11y';

import {LoadVideoVimeo} from './load-video-vimeo';
import {LoadVideoYT} from './load-video-youtube';

const selectors = {
  popupContainer: '.pswp',
  popupCloseBtn: '.pswp__custom-close',
  popupIframe: 'iframe, video',
  popupCustomIframe: '.pswp__custom-iframe',
  popupThumbs: '.pswp__thumbs',
  popupButtons: '.pswp__button, .pswp__caption-close',
};

const classes = {
  current: 'is-current',
  customLoader: 'pswp--custom-loader',
  customOpen: 'pswp--custom-opening',
  loader: 'pswp__loader',
  popupCloseButton: 'pswp__button--close',
  isFocused: 'is-focused',
};

const attributes = {
  dataOptionClasses: 'data-pswp-option-classes',
  dataVideoType: 'data-video-type',
  ariaCurrent: 'aria-current',
};

const loaderHTML = `<div class="${classes.loader}"><div class="loader pswp__loader-line"><div class="loader-indeterminate"></div></div></div>`;

class LoadPhotoswipe {
  constructor(items, options = '') {
    this.items = items;
    this.pswpElement = document.querySelectorAll(selectors.popupContainer)[0];
    this.popup = null;
    this.popupThumbs = null;
    this.isVideo = false;
    this.popupThumbsContainer = this.pswpElement.querySelector(selectors.popupThumbs);
    this.closeBtn = this.pswpElement.querySelector(selectors.popupCloseBtn);
    this.keyupCloseEvent = (e) => this.keyupClose(e);
    this.a11y = a11y;

    const defaultOptions = {
      history: false,
      focus: false,
      mainClass: '',
    };
    this.options = options !== '' ? options : defaultOptions;

    this.init();
  }

  init() {
    this.pswpElement.classList.add(classes.customOpen);

    this.initLoader();

    loadScript({url: window.theme.assets.photoswipe})
      .then(() => this.loadPopup())
      .catch((e) => console.error(e));
  }

  initLoader() {
    if (this.pswpElement.classList.contains(classes.customLoader) && this.options !== '' && this.options.mainClass) {
      this.pswpElement.setAttribute(attributes.dataOptionClasses, this.options.mainClass);
      let loaderElem = document.createElement('div');
      loaderElem.innerHTML = loaderHTML;
      loaderElem = loaderElem.firstChild;
      this.pswpElement.appendChild(loaderElem);
    } else {
      this.pswpElement.setAttribute(attributes.dataOptionClasses, '');
    }
  }

  loadPopup() {
    const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
    const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;

    if (this.pswpElement.classList.contains(classes.customLoader)) {
      this.pswpElement.classList.remove(classes.customLoader);
    }

    this.pswpElement.classList.remove(classes.customOpen);

    this.popup = new PhotoSwipe(this.pswpElement, PhotoSwipeUI, this.items, this.options);
    this.popup.init();

    this.initVideo();

    this.thumbsActions();

    if (this.isVideo) {
      this.hideUnusedButtons();
    }

    setTimeout(() => {
      this.a11y.trapFocus(this.pswpElement, {
        elementToFocus: this.closeBtn,
      });
    }, 200);

    this.popup.listen('close', () => this.onClose());

    if (this.options && this.options.closeElClasses && this.options.closeElClasses.length) {
      this.options.closeElClasses.forEach((closeClass) => {
        const closeElement = this.pswpElement.querySelector(`.pswp__${closeClass}`);
        if (closeElement) {
          closeElement.addEventListener('keyup', this.keyupCloseEvent);
        }
      });
    }
  }

  initVideo() {
    const videoContainer = this.pswpElement.querySelector(selectors.popupCustomIframe);
    if (videoContainer) {
      const videoType = videoContainer.getAttribute(attributes.dataVideoType);
      this.isVideo = true;

      if (videoType == 'youtube') {
        new LoadVideoYT(videoContainer.parentElement);
      } else if (videoType == 'vimeo') {
        new LoadVideoVimeo(videoContainer.parentElement);
      }
    }
  }

  thumbsActions() {
    if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
      this.popupThumbsContainer.addEventListener('wheel', (e) => this.stopDisabledScroll(e));
      this.popupThumbsContainer.addEventListener('mousewheel', (e) => this.stopDisabledScroll(e));
      this.popupThumbsContainer.addEventListener('DOMMouseScroll', (e) => this.stopDisabledScroll(e));

      this.popupThumbs = this.pswpElement.querySelectorAll(`${selectors.popupThumbs} > *`);
      this.popupThumbs.forEach((element, i) => {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          const lastCurrentElement = element.parentElement.querySelector(`.${classes.current}`);
          lastCurrentElement.classList.remove(classes.current);
          lastCurrentElement.setAttribute(attributes.ariaCurrent, false);
          element.classList.add(classes.current);
          element.setAttribute(attributes.ariaCurrent, true);
          this.popup.goTo(i);
        });
      });

      this.popup.listen('imageLoadComplete', () => this.setCurrentThumb());
      this.popup.listen('beforeChange', () => this.setCurrentThumb());
    }
  }

  hideUnusedButtons() {
    const buttons = this.pswpElement.querySelectorAll(selectors.popupButtons);
    if (buttons.length) {
      buttons.forEach((element) => {
        if (!element.classList.contains(classes.popupCloseButton)) {
          element.style.display = 'none';
        }
      });
    }
  }

  stopDisabledScroll(e) {
    e.stopPropagation();
  }

  keyupClose(e) {
    if (e.code === window.theme.keyboardKeys.ENTER) {
      this.popup.close();
    }
  }

  onClose() {
    const popupIframe = this.pswpElement.querySelector(selectors.popupIframe);
    if (popupIframe) {
      popupIframe.parentNode.removeChild(popupIframe);
    }

    if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
      while (this.popupThumbsContainer.firstChild) this.popupThumbsContainer.removeChild(this.popupThumbsContainer.firstChild);
    }

    this.pswpElement.setAttribute(attributes.dataOptionClasses, '');
    const loaderElem = this.pswpElement.querySelector(`.${classes.loader}`);
    if (loaderElem) {
      this.pswpElement.removeChild(loaderElem);
    }

    if (this.options && this.options.closeElClasses && this.options.closeElClasses.length) {
      this.options.closeElClasses.forEach((closeClass) => {
        const closeElement = this.pswpElement.querySelector(`.pswp__${closeClass}`);
        if (closeElement) {
          closeElement.removeEventListener('keyup', this.keyupCloseEvent);
        }
      });
    }

    this.a11y.removeTrapFocus();

    if (window.accessibility.lastElement && document.body.classList.contains(classes.isFocused)) {
      requestAnimationFrame(() => {
        window.accessibility.lastElement.focus();
      });
    }
  }

  setCurrentThumb() {
    const lastCurrentThumb = this.pswpElement.querySelector(`${selectors.popupThumbs} > .${classes.current}`);
    if (lastCurrentThumb) {
      lastCurrentThumb.classList.remove(classes.current);
      lastCurrentThumb.setAttribute(attributes.ariaCurrent, false);
    }

    if (!this.popupThumbs) return;
    const currentThumb = this.popupThumbs[this.popup.getCurrentIndex()];
    currentThumb.classList.add(classes.current);
    currentThumb.setAttribute(attributes.ariaCurrent, true);
    this.scrollThumbs(currentThumb);
  }

  scrollThumbs(currentThumb) {
    const thumbsContainerLeft = this.popupThumbsContainer.scrollLeft;
    const thumbsContainerWidth = this.popupThumbsContainer.offsetWidth;
    const thumbsContainerPos = thumbsContainerLeft + thumbsContainerWidth;
    const currentThumbLeft = currentThumb.offsetLeft;
    const currentThumbWidth = currentThumb.offsetWidth;
    const currentThumbPos = currentThumbLeft + currentThumbWidth;

    if (thumbsContainerPos <= currentThumbPos || thumbsContainerPos > currentThumbLeft) {
      const currentThumbMarginLeft = parseInt(window.getComputedStyle(currentThumb).marginLeft);
      this.popupThumbsContainer.scrollTo({
        top: 0,
        left: currentThumbLeft - currentThumbMarginLeft,
        behavior: 'smooth',
      });
    }
  }
}

export {LoadPhotoswipe};
