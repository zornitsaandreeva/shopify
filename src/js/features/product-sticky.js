import {isDesktop} from '../util/media-query';

const selectors = {
  slideshow: '[data-product-slideshow]',
  dataStickyEnabled: 'data-sticky-enabled',
  productPage: '.product__page',
  formWrapper: '[data-form-wrapper]',
  headerSticky: '[data-header-sticky]',
  headerHeight: '[data-header-height]',
};

const classes = {
  sticky: 'is-sticky',
};

window.theme.variables = {
  productPageSticky: false,
};

const sections = {};

class ProductSticky {
  constructor(section) {
    this.section = section;
    this.container = section.container;
    this.stickyEnabled = this.container.getAttribute(selectors.dataStickyEnabled) === 'true';
    this.formWrapper = this.container.querySelector(selectors.formWrapper);
    this.stickyScrollTop = 0;
    this.scrollLastPosition = 0;
    this.stickyDefaultTop = 0;
    this.currentPoint = 0;
    this.defaultTopBottomSpacings = 30;
    this.scrollTop = window.scrollY;
    this.scrollDirectionDown = true;
    this.requestAnimationSticky = null;
    this.stickyFormLoad = true;
    this.stickyFormLastHeight = null;
    this.onChangeCounter = 0;
    this.scrollEvent = (e) => this.scrollEvents(e);
    this.resizeEvent = (e) => this.resizeEvents(e);

    // The code should execute after truncate text in product.js - 50ms
    setTimeout(() => {
      this.init();
    }, 50);
  }

  init() {
    if (this.stickyEnabled) {
      this.stickyScrollCheck();

      document.addEventListener('theme:resize', this.resizeEvent);
    }

    this.initSticky();
  }

  initSticky() {
    if (theme.variables.productPageSticky) {
      this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());

      this.formWrapper.addEventListener('theme:form:sticky', (e) => {
        this.removeAnimationFrame();

        this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
      });

      document.addEventListener('theme:scroll', this.scrollEvent);
    }
  }

  scrollEvents(e) {
    this.scrollTop = e.detail.position;
    this.scrollDirectionDown = e.detail.down;

    if (!this.requestAnimationSticky) {
      this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());
    }
  }

  resizeEvents(e) {
    this.stickyScrollCheck();

    document.removeEventListener('theme:scroll', this.scrollEvent);

    this.initSticky();
  }

  stickyScrollCheck() {
    const targetFormWrapper = this.container.querySelector(`${selectors.productPage} ${selectors.formWrapper}`);

    if (!targetFormWrapper) return;

    if (isDesktop()) {
      const form = this.container.querySelector(selectors.formWrapper);
      const slideshow = this.container.querySelector(selectors.slideshow);
      if (!form || !slideshow) return;
      const productCopyHeight = form.offsetHeight;
      const productImagesHeight = slideshow.offsetHeight;

      // Is the product description and form taller than window space
      // Is also shorter than the window and images
      if (productCopyHeight < productImagesHeight) {
        theme.variables.productPageSticky = true;
        targetFormWrapper.classList.add(classes.sticky);
      } else {
        theme.variables.productPageSticky = false;
        targetFormWrapper.classList.remove(classes.sticky);
      }
    } else {
      theme.variables.productPageSticky = false;
      targetFormWrapper.classList.remove(classes.sticky);
    }
  }

  calculateStickyPosition(e = null) {
    const isScrollLocked = document.documentElement.hasAttribute('data-scroll-locked');
    if (isScrollLocked) {
      this.removeAnimationFrame();
      return;
    }

    const eventExist = Boolean(e && e.detail);
    const isAccordion = Boolean(eventExist && e.detail.element && e.detail.element === 'accordion');
    const formWrapperHeight = this.formWrapper.offsetHeight;
    const heightDifference = window.innerHeight - formWrapperHeight - this.defaultTopBottomSpacings;
    const scrollDifference = Math.abs(this.scrollTop - this.scrollLastPosition);

    if (this.scrollDirectionDown) {
      this.stickyScrollTop -= scrollDifference;
    } else {
      this.stickyScrollTop += scrollDifference;
    }

    if (this.stickyFormLoad) {
      if (document.querySelector(selectors.headerSticky) && document.querySelector(selectors.headerHeight)) {
        this.stickyDefaultTop = parseInt(document.querySelector(selectors.headerHeight).getBoundingClientRect().height);
      } else {
        this.stickyDefaultTop = this.defaultTopBottomSpacings;
      }

      this.stickyScrollTop = this.stickyDefaultTop;
    }

    this.stickyScrollTop = Math.min(Math.max(this.stickyScrollTop, heightDifference), this.stickyDefaultTop);

    const differencePoint = this.stickyScrollTop - this.currentPoint;
    this.currentPoint = this.stickyFormLoad ? this.stickyScrollTop : this.currentPoint + differencePoint * 0.5;

    this.formWrapper.style.setProperty('--sticky-top', `${this.currentPoint}px`);

    this.scrollLastPosition = this.scrollTop;
    this.stickyFormLoad = false;

    if (
      (isAccordion && this.onChangeCounter <= 10) ||
      (isAccordion && this.stickyFormLastHeight !== formWrapperHeight) ||
      (this.stickyScrollTop !== this.currentPoint && this.requestAnimationSticky)
    ) {
      if (isAccordion) {
        this.onChangeCounter += 1;
      }

      if (isAccordion && this.stickyFormLastHeight !== formWrapperHeight) {
        this.onChangeCounter = 11;
      }

      this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
    } else if (this.requestAnimationSticky) {
      this.removeAnimationFrame();
    }

    this.stickyFormLastHeight = formWrapperHeight;
  }

  removeAnimationFrame() {
    if (this.requestAnimationSticky) {
      cancelAnimationFrame(this.requestAnimationSticky);
      this.requestAnimationSticky = null;
      this.onChangeCounter = 0;
    }
  }

  onUnload() {
    if (this.stickyEnabled) {
      document.removeEventListener('theme:resize', this.resizeEvent);
    }

    if (theme.variables.productPageSticky) {
      document.removeEventListener('theme:scroll', this.scrollEvent);
    }
  }
}

const productStickySection = {
  onLoad() {
    sections[this.id] = new ProductSticky(this);
  },
  onUnload() {
    sections[this.id].onUnload();
  },
};

export {productStickySection};
