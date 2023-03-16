import {register} from '../vendor/theme-scripts/theme-sections';
import debounce from '../util/debounce';
import drawer from '../features/header-mobile-drawer';
import stickyHeader from '../features/header-sticky';
import hoverDisclosure from '../features/header-hover-disclosure';
import {readHeights, setVarsOnResize, getScreenOrientation} from '../globals/height';
import headerTotals from '../features/header-totals';
import {popoutSection} from '../features/popout';
import headerMobileSliderule from '../features/header-mobile-sliderule';
import {isMobile} from '../util/media-query';

const selectors = {
  wrapper: '[data-header-wrapper]',
  html: 'html',
  style: 'data-header-style',
  widthContentWrapper: '[data-takes-space-wrapper]',
  widthContent: '[data-child-takes-space]',
  desktop: '[data-header-desktop]',
  cloneClass: 'js__header__clone',
  showMobileClass: 'js__show__mobile',
  backfill: '[data-header-backfill]',
  transparent: 'data-header-transparent',
  firstSectionHasImage: '.main-content > .shopify-section:first-child [data-overlay-header]',
  preventTransparentHeader: '.main-content > .shopify-section:first-child [data-prevent-transparent-header]',
  deadLink: '.navlink[href="#"]',
};

const classes = {
  hasTransparentHeader: 'has-transparent-header',
};

let sections = {};

class Header {
  constructor(el) {
    this.wrapper = el;
    this.html = document.querySelector(selectors.html);
    this.style = this.wrapper.dataset.style;
    this.desktop = this.wrapper.querySelector(selectors.desktop);
    this.isTransparentHeader = this.wrapper.getAttribute(selectors.transparent) !== 'false';
    this.overlayedImages = document.querySelectorAll(selectors.firstSectionHasImage);
    this.deadLinks = document.querySelectorAll(selectors.deadLink);
    this.headerUpdateEvent = debounce(() => this.checkForImage(), 500);
    this.resizeEventWidth = () => this.checkWidth();
    this.resizeEventOverlay = () => this.subtractAnnouncementHeight();

    this.killDeadLinks();
    if (this.style !== 'drawer' && this.desktop) {
      this.minWidth = this.getMinWidth();
      this.listenWidth();
    }
    this.checkForImage();
    this.listenSectionEvents();
    this.screenOrientation = getScreenOrientation();
  }

  checkForImage() {
    // check again for overlayed images
    this.overlayedImages = document.querySelectorAll(selectors.firstSectionHasImage);
    let preventTransparentHeader = document.querySelectorAll(selectors.preventTransparentHeader).length;

    if (this.overlayedImages.length && !preventTransparentHeader && this.isTransparentHeader) {
      // is transparent and has image, overlay the image
      this.listenOverlay();
      this.wrapper.setAttribute(selectors.transparent, true);
      document.querySelector(selectors.backfill).style.display = 'none';
      theme.settings.transparentHeader = true;
      document.body.classList.add(classes.hasTransparentHeader);
    } else {
      this.wrapper.setAttribute(selectors.transparent, false);
      document.querySelector(selectors.backfill).style.display = 'block';
      theme.settings.transparentHeader = false;
      document.body.classList.remove(classes.hasTransparentHeader);
    }

    this.subtractAnnouncementHeight();
  }

  listenOverlay() {
    document.addEventListener('theme:resize', this.resizeEventOverlay);
    this.subtractAnnouncementHeight();
  }

  listenWidth() {
    document.addEventListener('theme:resize', this.resizeEventWidth);
    this.checkWidth();
  }

  listenSectionEvents() {
    document.addEventListener('shopify:section:load', this.headerUpdateEvent);
    document.addEventListener('shopify:section:unload', this.headerUpdateEvent);
    document.addEventListener('shopify:section:reorder', this.headerUpdateEvent);
  }

  killDeadLinks() {
    this.deadLinks.forEach((el) => {
      el.onclick = (e) => {
        e.preventDefault();
      };
    });
  }

  subtractAnnouncementHeight() {
    const currentScreenOrientation = getScreenOrientation();
    const {announcementHeight, headerHeight} = readHeights();
    let {windowHeight} = readHeights();

    // Use the initial window height on mobile devices except if screen oriantation changes
    if (this.screenOrientation === currentScreenOrientation && isMobile()) {
      windowHeight = window.initialWindowHeight;
    } else {
      window.initialWindowHeight = windowHeight;
    }

    this.overlayedImages.forEach((el) => {
      if (theme.settings.transparentHeader) {
        el.style.setProperty('--full-screen', `${windowHeight - announcementHeight}px`);
      } else {
        // headerHeight includes announcement bar height
        el.style.setProperty('--full-screen', `${windowHeight - headerHeight}px`);
      }
      el.classList.add('has-overlay');
    });

    // Update screenOrientation state
    if (this.screenOrientation !== currentScreenOrientation) {
      this.screenOrientation = currentScreenOrientation;
    }
  }

  checkWidth() {
    if (document.body.clientWidth < this.minWidth) {
      this.wrapper.classList.add(selectors.showMobileClass);
    } else {
      this.wrapper.classList.remove(selectors.showMobileClass);
    }
  }

  getMinWidth() {
    const comparitor = this.wrapper.cloneNode(true);
    comparitor.classList.add(selectors.cloneClass);
    document.body.appendChild(comparitor);
    const widthWrappers = comparitor.querySelectorAll(selectors.widthContentWrapper);
    let minWidth = 0;
    let spaced = 0;

    widthWrappers.forEach((context) => {
      const wideElements = context.querySelectorAll(selectors.widthContent);
      let thisWidth = 0;
      if (wideElements.length === 3) {
        thisWidth = _sumSplitWidths(wideElements);
      } else {
        thisWidth = _sumWidths(wideElements);
      }
      if (thisWidth > minWidth) {
        minWidth = thisWidth;
        spaced = wideElements.length * 20;
      }
    });

    document.body.removeChild(comparitor);
    return minWidth + spaced;
  }

  unload() {
    document.removeEventListener('theme:resize', this.resizeEventWidth);
    document.removeEventListener('theme:resize', this.resizeEventOverlay);
    document.removeEventListener('shopify:section:load', this.headerUpdateEvent);
    document.removeEventListener('shopify:section:unload', this.headerUpdateEvent);
    document.removeEventListener('shopify:section:reorder', this.headerUpdateEvent);
  }
}

function _sumSplitWidths(nodes) {
  let arr = [];
  nodes.forEach((el) => {
    if (el.firstElementChild) {
      arr.push(el.firstElementChild.clientWidth);
    }
  });
  if (arr[0] > arr[2]) {
    arr[2] = arr[0];
  } else {
    arr[0] = arr[2];
  }
  const width = arr.reduce((a, b) => a + b);
  return width;
}
function _sumWidths(nodes) {
  let width = 0;
  nodes.forEach((el) => {
    width += el.clientWidth;
  });
  return width;
}

const header = {
  onLoad() {
    sections = new Header(this.container);

    setVarsOnResize();
  },
  onUnload() {
    if (typeof sections.unload === 'function') {
      sections.unload();
    }
  },
};

register('header', [header, drawer, popoutSection, headerMobileSliderule, stickyHeader, hoverDisclosure, headerTotals]);
