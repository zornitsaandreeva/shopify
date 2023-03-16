const selectors = {
  headerWrapper: '[data-header-wrapper]',
  header: '[data-header-wrapper] header',
  pageHeader: '.page-header',
};

const classes = {
  stuck: 'js__header__stuck',
  stuckAnimated: 'js__header__stuck--animated',
  triggerAnimation: 'js__header__stuck--trigger-animation',
  stuckBackdrop: 'js__header__stuck__backdrop',
  headerIsNotVisible: 'is-not-visible',
  hasStickyHeader: 'has-sticky-header',
  headerGroup: 'shopify-section-group-header-group',
};

const attributes = {
  transparent: 'data-header-transparent',
  stickyHeader: 'data-header-sticky',
  scrollLock: 'data-scroll-locked',
};

let sections = {};

class Sticky {
  constructor(el) {
    this.wrapper = el;
    this.type = this.wrapper.dataset.headerSticky;
    this.sticks = false;
    this.static = true;
    if (this.wrapper.hasAttribute(attributes.stickyHeader)) {
      this.sticks = true;
      this.static = false;
    }
    this.win = window;
    this.animated = this.type === 'directional';
    this.currentlyStuck = false;
    this.cls = this.wrapper.classList;
    this.headerOffset = document.querySelector(selectors.pageHeader)?.offsetTop;
    this.headerHeight = document.querySelector(selectors.header).clientHeight;
    this.scrollEventStatic = () => this.checkIsVisible();
    this.scrollEventListen = (e) => this.listenScroll(e);
    this.scrollEventUpListen = () => this.scrollUpDirectional();
    this.scrollEventDownListen = () => this.scrollDownDirectional();
    this.updateHeaderOffset = this.updateHeaderOffset.bind(this);

    if (this.sticks) {
      this.scrollDownInit();
      document.body.classList.add(classes.hasStickyHeader);
    }

    if (this.static) {
      document.addEventListener('theme:scroll', this.scrollEventStatic);
    }

    this.listen();
  }

  unload() {
    if (this.sticks || this.animated) {
      document.removeEventListener('theme:scroll', this.scrollEventListen);
    }

    if (this.animated) {
      document.removeEventListener('theme:scroll:up', this.scrollEventUpListen);
      document.removeEventListener('theme:scroll:down', this.scrollEventDownListen);
    }

    if (this.static) {
      document.removeEventListener('theme:scroll', this.scrollEventStatic);
    }

    document.removeEventListener('shopify:section:load', this.updateHeaderOffset);
    document.removeEventListener('shopify:section:unload', this.updateHeaderOffset);
  }

  listen() {
    if (this.sticks || this.animated) {
      document.addEventListener('theme:scroll', this.scrollEventListen);
    }

    if (this.animated) {
      document.addEventListener('theme:scroll:up', this.scrollEventUpListen);
      document.addEventListener('theme:scroll:down', this.scrollEventDownListen);
    }

    document.addEventListener('shopify:section:load', this.updateHeaderOffset);
    document.addEventListener('shopify:section:unload', this.updateHeaderOffset);
  }

  listenScroll(e) {
    if (e.detail.down) {
      if (!this.currentlyStuck && e.detail.position > this.headerOffset) {
        this.stickSimple();
      }
      if (!this.currentlyBlurred && e.detail.position > this.headerOffset) {
        this.addBlur();
      }
    } else {
      if (e.detail.position <= this.headerOffset) {
        this.unstickSimple();
      }
      if (e.detail.position <= this.headerOffset) {
        this.removeBlur();
      }
    }
  }

  updateHeaderOffset(event) {
    if (!event.target.classList.contains(classes.headerGroup)) return;

    // Update header offset after any "Header group" section has been changed
    setTimeout(() => {
      this.headerOffset = document.querySelector(selectors.pageHeader)?.offsetTop;
    });
  }

  stickSimple() {
    if (this.animated) {
      this.cls.add(classes.stuckAnimated);
    }
    this.cls.add(classes.stuck);
    this.wrapper.setAttribute(attributes.transparent, false);
    this.currentlyStuck = true;
  }

  unstickSimple() {
    if (!document.documentElement.hasAttribute(attributes.scrollLock)) {
      // check for scroll lock
      this.cls.remove(classes.stuck);
      this.wrapper.setAttribute(attributes.transparent, theme.settings.transparentHeader);
      if (this.animated) {
        this.cls.remove(classes.stuckAnimated);
      }
      this.currentlyStuck = false;
    }
  }

  scrollDownInit() {
    if (window.scrollY > this.headerOffset) {
      this.stickSimple();
    }
    if (window.scrollY > this.headerOffset) {
      this.addBlur();
    }
  }

  stickDirectional() {
    this.cls.add(classes.triggerAnimation);
  }

  unstickDirectional() {
    this.cls.remove(classes.triggerAnimation);
  }

  scrollDownDirectional() {
    this.unstickDirectional();
  }

  scrollUpDirectional() {
    if (window.scrollY <= this.headerOffset) {
      this.unstickDirectional();
    } else {
      this.stickDirectional();
    }
  }

  addBlur() {
    this.cls.add(classes.stuckBackdrop);
    this.currentlyBlurred = true;
  }

  removeBlur() {
    this.cls.remove(classes.stuckBackdrop);
    this.currentlyBlurred = false;
  }

  checkIsVisible() {
    const header = document.querySelector(selectors.headerWrapper);
    const isHeaderSticky = header.getAttribute(attributes.stickyHeader);
    const currentScroll = this.win.pageYOffset;

    if (!isHeaderSticky) {
      header.classList.toggle(classes.headerIsNotVisible, currentScroll >= this.headerHeight);
    }
  }
}

const stickyHeader = {
  onLoad() {
    sections = new Sticky(this.container);
  },
  onUnload: function () {
    if (typeof sections.unload === 'function') {
      sections.unload();
    }
  },
};

export default stickyHeader;
