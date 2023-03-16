import slideUp from '../util/slide-up';
import * as a11y from '../vendor/theme-scripts/theme-a11y';

const classes = {
  focus: 'is-focused',
  open: 'is-open',
  accordionToggle: 'accordion-toggle',
  tabLink: 'tab-link',
};

const selectors = {
  inPageLink: '[data-skip-content]',
  linkesWithOnlyHash: 'a[href="#"]',
  triggerFocusElement: '[data-focus-element]',
  accordionContent: '.accordion-content',
  accordionToggle: 'data-accordion-toggle',
};

class Accessibility {
  constructor() {
    this.init();
  }

  init() {
    this.a11y = a11y;

    // DOM Elements
    this.html = document.documentElement;
    this.body = document.body;
    this.inPageLink = document.querySelector(selectors.inPageLink);
    this.linkesWithOnlyHash = document.querySelectorAll(selectors.linkesWithOnlyHash);
    this.lastFocused = null;

    // Flags
    this.isFocused = false;

    // A11Y init methods
    this.a11y.focusHash();
    this.a11y.bindInPageLinks();

    // Events
    this.clickEvents();
    this.focusEvents();
    this.focusEventsOff();
    this.closeExpandedElements();
  }

  /**
   * Clicked events accessibility
   *
   * @return  {Void}
   */

  clickEvents() {
    if (this.inPageLink) {
      this.inPageLink.addEventListener('click', (event) => {
        event.preventDefault();
      });
    }

    if (this.linkesWithOnlyHash) {
      this.linkesWithOnlyHash.forEach((item) => {
        item.addEventListener('click', (event) => {
          event.preventDefault();
        });
      });
    }
  }

  /**
   * Focus events
   *
   * @return  {Void}
   */

  focusEvents() {
    document.addEventListener('keyup', (event) => {
      if (event.code !== window.theme.keyboardKeys.TAB) {
        return;
      }

      this.body.classList.add(classes.focus);
      this.isFocused = true;
    });

    // Expand modals
    document.addEventListener('keyup', (event) => {
      if (!this.isFocused) {
        return;
      }

      const target = event.target;
      const pressEnterOrSpace = event.code === window.theme.keyboardKeys.ENTER || event.code === window.theme.keyboardKeys.SPACE;
      const targetElement = target.matches(selectors.triggerFocusElement) || target.closest(selectors.triggerFocusElement);
      const isAccordion =
        target.classList.contains(classes.accordionToggle) ||
        target.parentNode.classList.contains(classes.accordionToggle) ||
        target.hasAttribute(selectors.accordionToggle) ||
        target.parentNode.hasAttribute(selectors.accordionToggle);
      const isTab = target.classList.contains(classes.tabLink) || target.parentNode.classList.contains(classes.tabLink);

      if (pressEnterOrSpace && targetElement) {
        if (this.lastFocused === null) {
          this.lastFocused = target;
        }

        if (isAccordion) {
          target.click();
        }

        if (isTab) {
          target.click();
        }
      }
    });

    // Focus addToCart button or quickview button
    document.addEventListener('theme:cart:add', (event) => {
      this.lastFocused = event.detail.selector;
    });
  }

  /**
   * Focus events off
   *
   * @return  {Void}
   */

  focusEventsOff() {
    document.addEventListener('mousedown', () => {
      this.body.classList.remove(classes.focus);
      this.isFocused = false;
    });
  }

  /**
   * Close expanded elements with when press escape
   *
   * @return  {Void}
   */

  closeExpandedElements() {
    document.addEventListener('keyup', (event) => {
      if (event.code !== window.theme.keyboardKeys.ESCAPE) {
        return;
      }

      const accordionContents = document.querySelectorAll(selectors.accordionContent);

      if (accordionContents.length) {
        for (let i = 0; i < accordionContents.length; i++) {
          if (accordionContents[i].style.display !== 'block') {
            continue;
          }

          const accordionArrow = accordionContents[i].previousElementSibling;
          accordionArrow.classList.remove(classes.open);

          slideUp(accordionContents[i]);
        }
      }

      if (this.lastFocused !== null) {
        setTimeout(() => {
          this.lastFocused.focus();
          this.lastFocused = null;
        }, 600);
      }
    });
  }
}

window.accessibility = new Accessibility();
