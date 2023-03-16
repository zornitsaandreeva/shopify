import * as a11y from '../vendor/theme-scripts/theme-a11y';

const selectors = {
  slideruleOpen: 'data-sliderule-open',
  slideruleClose: 'data-sliderule-close',
  sliderulePane: 'data-sliderule-pane',
  slideruleWrappper: '[data-sliderule]',
  drawerContent: '[data-drawer-content]',
  focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  dataAnimates: 'data-animates',
  children: `:scope > [data-animates], 
             :scope > * > [data-animates], 
             :scope > * > * >[data-animates],
             :scope > * > .sliderule-grid  > *`,
};

const classes = {
  isVisible: 'is-visible',
  isHiding: 'is-hiding',
  isHidden: 'is-hidden',
  focused: 'is-focused',
  scrolling: 'is-scrolling',
};

let sections = {};

class HeaderMobileSliderule {
  constructor(el) {
    this.sliderule = el;
    this.key = this.sliderule.id;
    const btnSelector = `[${selectors.slideruleOpen}='${this.key}']`;
    this.exitSelector = `[${selectors.slideruleClose}='${this.key}']`;
    this.trigger = document.querySelector(btnSelector);
    this.exit = document.querySelectorAll(this.exitSelector);
    this.pane = document.querySelector(`[${selectors.sliderulePane}]`);
    this.children = this.sliderule.querySelectorAll(selectors.children);
    this.drawerContent = document.querySelector(selectors.drawerContent);
    this.cachedButton = null;
    this.accessibility = a11y;

    this.trigger.setAttribute('aria-haspopup', true);
    this.trigger.setAttribute('aria-expanded', false);
    this.trigger.setAttribute('aria-controls', this.key);
    this.closeSliderule = this.closeSliderule.bind(this);

    this.clickEvents();
    this.keyboardEvents();

    document.addEventListener('theme:sliderule:close', this.closeSliderule);
  }

  clickEvents() {
    this.trigger.addEventListener('click', () => {
      this.cachedButton = this.trigger;
      this.showSliderule();
    });
    this.exit.forEach((element) => {
      element.addEventListener('click', () => {
        this.hideSliderule();
      });
    });
  }

  keyboardEvents() {
    this.sliderule.addEventListener('keyup', (evt) => {
      evt.stopPropagation();
      if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
        return;
      }

      this.hideSliderule();
    });
  }

  trapFocusSliderule(showSliderule = true) {
    const trapFocusButton = showSliderule ? this.sliderule.querySelector(this.exitSelector) : this.cachedButton;

    this.accessibility.removeTrapFocus();

    if (trapFocusButton && this.drawerContent) {
      this.accessibility.trapFocus(this.drawerContent, {
        elementToFocus: document.body.classList.contains(classes.focused) ? trapFocusButton : null,
      });
    }
  }

  hideSliderule(close = false) {
    const newPosition = parseInt(this.pane.dataset.sliderulePane, 10) - 1;
    this.pane.setAttribute(selectors.sliderulePane, newPosition);
    this.pane.classList.add(classes.isHiding);
    this.sliderule.classList.add(classes.isHiding);
    const hiddenSelector = close ? `[${selectors.dataAnimates}].${classes.isHidden}` : `[${selectors.dataAnimates}="${newPosition}"]`;
    const hiddenItems = this.pane.querySelectorAll(hiddenSelector);
    if (hiddenItems.length) {
      hiddenItems.forEach((element) => {
        element.classList.remove(classes.isHidden);
      });
    }

    const children = close ? this.pane.querySelectorAll(`.${classes.isVisible}, .${classes.isHiding}`) : this.children;
    children.forEach((element, index) => {
      const lastElement = children.length - 1 == index;
      element.classList.remove(classes.isVisible);
      if (close) {
        element.classList.remove(classes.isHiding);
        this.pane.classList.remove(classes.isHiding);
      }
      const removeHidingClass = () => {
        if (parseInt(this.pane.getAttribute(selectors.sliderulePane)) === newPosition) {
          this.sliderule.classList.remove(classes.isVisible);
        }
        this.sliderule.classList.remove(classes.isHiding);
        this.pane.classList.remove(classes.isHiding);

        if (lastElement) {
          this.accessibility.removeTrapFocus();
          if (!close) {
            this.trapFocusSliderule(false);
          }
        }

        element.removeEventListener('animationend', removeHidingClass);
      };

      if (window.theme.settings.enableAnimations) {
        element.addEventListener('animationend', removeHidingClass);
      } else {
        removeHidingClass();
      }
    });
  }

  showSliderule() {
    let lastScrollableFrame = null;
    const parent = this.sliderule.closest(`.${classes.isVisible}`);
    let lastScrollableElement = this.pane;

    if (parent) {
      lastScrollableElement = parent;
    }

    lastScrollableElement.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });

    lastScrollableElement.classList.add(classes.scrolling);

    const lastScrollableIsScrolling = () => {
      if (lastScrollableElement.scrollTop <= 0) {
        lastScrollableElement.classList.remove(classes.scrolling);
        if (lastScrollableFrame) {
          cancelAnimationFrame(lastScrollableFrame);
        }
      } else {
        lastScrollableFrame = requestAnimationFrame(lastScrollableIsScrolling);
      }
    };

    lastScrollableFrame = requestAnimationFrame(lastScrollableIsScrolling);

    this.sliderule.classList.add(classes.isVisible);
    const oldPosition = parseInt(this.pane.dataset.sliderulePane, 10);
    const newPosition = oldPosition + 1;
    this.pane.setAttribute(selectors.sliderulePane, newPosition);

    const hiddenItems = this.pane.querySelectorAll(`[${selectors.dataAnimates}="${oldPosition}"]`);
    if (hiddenItems.length) {
      hiddenItems.forEach((element, index) => {
        const lastElement = hiddenItems.length - 1 == index;
        element.classList.add(classes.isHiding);
        const removeHidingClass = () => {
          element.classList.remove(classes.isHiding);
          if (parseInt(this.pane.getAttribute(selectors.sliderulePane)) !== oldPosition) {
            element.classList.add(classes.isHidden);
          }

          if (lastElement) {
            this.trapFocusSliderule();
          }
          element.removeEventListener('animationend', removeHidingClass);
        };

        if (window.theme.settings.enableAnimations) {
          element.addEventListener('animationend', removeHidingClass);
        } else {
          removeHidingClass();
        }
      });
    }
  }

  closeSliderule() {
    if (this.pane && this.pane.hasAttribute(selectors.sliderulePane) && parseInt(this.pane.getAttribute(selectors.sliderulePane)) > 0) {
      this.hideSliderule(true);
      if (parseInt(this.pane.getAttribute(selectors.sliderulePane)) > 0) {
        this.pane.setAttribute(selectors.sliderulePane, 0);
      }
    }
  }

  onUnload() {
    document.removeEventListener('theme:sliderule:close', this.closeSliderule);
  }
}

const headerMobileSliderule = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(selectors.slideruleWrappper);
    els.forEach((el) => {
      sections[this.id].push(new HeaderMobileSliderule(el));
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

export default headerMobileSliderule;
