import * as a11y from '../vendor/theme-scripts/theme-a11y';

const selectors = {
  body: 'body',
  drawerWrappper: '[data-drawer]',
  drawerInner: '[data-drawer-inner]',
  underlay: '[data-drawer-underlay]',
  stagger: '[data-stagger-animation]',
  wrapper: '[data-header-transparent]',
  drawerToggle: 'data-drawer-toggle',
  scrollableElements: '[data-sliderule-pane], [data-sliderule]',
  focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
};

const classes = {
  animated: 'drawer--animated',
  open: 'is-open',
  isFocused: 'is-focused',
  headerStuck: 'js__header__stuck',
};

let sections = {};

class Drawer {
  constructor(el) {
    this.drawer = el;
    this.drawerWrapper = this.drawer.closest(selectors.drawerWrappper);
    this.drawerInner = this.drawer.querySelector(selectors.drawerInner);
    this.scrollableElements = this.drawer.querySelectorAll(selectors.scrollableElements);
    this.underlay = this.drawer.querySelector(selectors.underlay);
    this.wrapper = this.drawer.closest(selectors.wrapper);
    this.key = this.drawer.dataset.drawer;
    this.btnSelector = `[${selectors.drawerToggle}='${this.key}']`;
    this.buttons = document.querySelectorAll(this.btnSelector);
    this.staggers = this.drawer.querySelectorAll(selectors.stagger);
    this.body = document.querySelector(selectors.body);
    this.accessibility = a11y;

    this.initWatchFocus = (evt) => this.watchFocus(evt);
    this.showDrawer = this.showDrawer.bind(this);
    this.hideDrawer = this.hideDrawer.bind(this);

    this.connectToggle();
    this.connectDrawer();
    this.closers();
  }

  connectToggle() {
    this.buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.drawer.dispatchEvent(
          new CustomEvent('theme:drawer:toggle', {
            bubbles: false,
          })
        );
      });
    });
  }

  connectDrawer() {
    this.drawer.addEventListener('theme:drawer:toggle', () => {
      if (this.drawer.classList.contains(classes.open)) {
        this.drawer.dispatchEvent(
          new CustomEvent('theme:drawer:close', {
            bubbles: true,
          })
        );
      } else {
        this.drawer.dispatchEvent(
          new CustomEvent('theme:drawer:open', {
            bubbles: true,
          })
        );
      }
    });

    if (this.drawerInner) {
      this.drawerInner.addEventListener('transitionend', (event) => {
        if (event.target != this.drawerInner) return;

        if (!this.drawer.classList.contains(classes.open)) {
          this.drawer.classList.remove(classes.animated);
          // Reset menu items state after drawer hiding animation completes
          document.dispatchEvent(new CustomEvent('theme:sliderule:close', {bubbles: false}));
        }
      });
    }

    document.addEventListener('theme:cart:open', this.hideDrawer);
    document.addEventListener('theme:drawer:close', this.hideDrawer);
    document.addEventListener('theme:drawer:open', this.showDrawer);
  }

  watchFocus(evt) {
    let drawerInFocus = this.wrapper.contains(evt.target);
    if (!drawerInFocus && this.body.classList.contains(classes.isFocused)) {
      this.hideDrawer();
    }
  }

  closers() {
    this.wrapper.addEventListener(
      'keyup',
      function (evt) {
        if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
          return;
        }
        this.hideDrawer();
        this.buttons[0].focus();
      }.bind(this)
    );

    this.underlay.addEventListener('click', () => {
      this.hideDrawer();
    });
  }

  showDrawer() {
    if (this.drawerInner && this.drawerInner.querySelector(this.btnSelector)) {
      this.accessibility.removeTrapFocus();
      this.drawerInner.addEventListener('transitionend', (event) => {
        if (event.target != this.drawerInner) return;

        if (this.drawer.classList.contains(classes.open)) {
          this.accessibility.trapFocus(this.drawerInner, {
            elementToFocus: this.drawerInner.querySelector(this.btnSelector),
          });
        }
      });
    }

    this.buttons.forEach((el) => {
      el.setAttribute('aria-expanded', true);
    });

    this.drawer.classList.add(classes.open);
    this.drawer.classList.add(classes.animated);

    this.drawer.querySelector(selectors.focusable).focus();

    document.addEventListener('focusin', this.initWatchFocus);

    if (this.scrollableElements.length) {
      this.scrollableElements.forEach((scrollableElement) => {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: scrollableElement}));
      });
    }
  }

  hideDrawer() {
    if (!this.drawer.classList.contains(classes.open)) {
      return;
    }

    this.accessibility.removeTrapFocus();
    if (this.body.classList.contains(classes.isFocused) && this.buttons.length) {
      this.buttons[0].focus();
    }

    this.buttons.forEach((el) => {
      el.setAttribute('aria-expanded', false);
    });

    this.drawer.classList.remove(classes.open);
    document.removeEventListener('focusin', this.initWatchFocus);

    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }

  onUnload() {
    document.removeEventListener('theme:cart:open', this.hideDrawer);
    document.removeEventListener('theme:drawer:close', this.hideDrawer);
    document.removeEventListener('theme:drawer:open', this.showDrawer);
  }
}

const drawer = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(selectors.drawerWrappper);
    els.forEach((el) => {
      sections[this.id].push(new Drawer(el));
    });
  },
  onUnload() {
    sections[this.id].forEach((el) => {
      if (typeof el.onUnload === 'function') {
        el.onUnload();
      }
    });
  },
};

export default drawer;
