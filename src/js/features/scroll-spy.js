import {isDesktop} from '../util/media-query';
import {readHeights} from '../globals/height';

const selectors = {
  scrollSpy: '[data-scroll-spy]',
  headerSticky: '[data-header-sticky]',
};

const classes = {
  selected: 'is-selected',
};

const attributes = {
  scrollSpy: 'data-scroll-spy',
  mobile: 'data-scroll-spy-mobile',
  desktop: 'data-scroll-spy-desktop',
};

const sections = {};

class ScrollSpy {
  constructor(section) {
    this.section = section;
    this.container = section.container;
    this.scrollSpyAnchors = this.container.querySelectorAll(selectors.scrollSpy);
    this.loopAnchors = this.loopAnchors.bind(this);
    this.observers = [];

    this.init();
  }

  init() {
    this.loopAnchors();
    document.addEventListener('theme:resize:width', this.loopAnchors);
  }

  loopAnchors() {
    if (!this.scrollSpyAnchors.length) return;

    this.scrollSpyAnchors.forEach((anchor) => {
      this.toggleObserver(anchor);
    });
  }

  toggleObserver(anchor) {
    const anchorSpy = this.container.querySelector(anchor.getAttribute(attributes.scrollSpy));

    if (!anchorSpy) return;

    // Stop observer to prevent running it multuple times
    if (this.observers[anchorSpy.id]) {
      this.observers[anchorSpy.id].unobserve(anchorSpy);
    }

    const isDesktopView = isDesktop();
    const isEligible =
      (!isDesktopView && anchor.hasAttribute(attributes.mobile)) ||
      (isDesktopView && anchor.hasAttribute(attributes.desktop)) ||
      (!anchor.hasAttribute(attributes.desktop) && !anchor.hasAttribute(attributes.mobile));

    if (isEligible) {
      this.runObserver(anchorSpy);
    }
  }

  runObserver(anchorSpy) {
    let {menuHeight} = readHeights();
    const stickyHeader = Boolean(document.querySelector(selectors.headerSticky));
    const headerHeight = stickyHeader ? menuHeight : 0;
    const rootMargin = stickyHeader ? headerHeight * -1 + 'px 0px 0px 0px' : '0px';

    const options = {
      rootMargin: rootMargin,
      threshold: [0.5, 1],
    };

    this.observers[anchorSpy.id] = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const anchorOld = this.container.querySelector(`[${attributes.scrollSpy}].${classes.selected}`);
        const anchorNew = this.container.querySelector(`[${attributes.scrollSpy}="#${entry.target.id}"]`);

        if (entry.intersectionRatio > 0.5 && entry.boundingClientRect.top - headerHeight <= entry.boundingClientRect.height) {
          anchorOld?.classList.remove(classes.selected);
          anchorNew?.classList.add(classes.selected);
        }
      });
    }, options);
    this.observers[anchorSpy.id].observe(anchorSpy);
  }

  onUnload() {
    document.removeEventListener('theme:resize:width', this.loopAnchors);

    if (this.observers.length) {
      this.observers.forEach((observer) => {
        observer.disconnect();
      });
    }
  }
}

const scrollSpy = {
  onLoad() {
    sections[this.id] = new ScrollSpy(this);
  },
  onUnload() {
    sections[this.id].onUnload();
  },
};

export default scrollSpy;
