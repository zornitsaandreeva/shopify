import {register} from '../vendor/theme-scripts/theme-sections';
import * as a11y from '../vendor/theme-scripts/theme-a11y';
import {slider} from '../features/slider';
import parallaxHero from '../features/parallax-hero';
import {popoutSection} from '../features/popout';
import {swatchGridSection, Swatch} from '../features/swatch';
import {QuickAddProduct} from '../features/quick-add-product';
import {siblings} from '../features/siblings';
import collectionFiltersForm from '../features/collection-filters-form';
import {tooltipSection} from '../features/tooltip';
import slideToggle from '../util/slide-toggle';
import {isMobile} from '../util/media-query';

const selectors = {
  dataSort: 'data-sort-enabled',
  sortLinks: '[data-sort-link]',
  sortValue: 'data-value',
  sortButton: '[data-popout-toggle]',
  sortButtonText: '[data-sort-button-text]',
  collectionSidebarHeading: '[data-collection-sidebar-heading]',
  collectionSidebar: '[data-collection-sidebar]',
  collectionSidebarSlider: '[data-collection-sidebar-slider]',
  collectionSidebarSlideOut: '[data-collection-sidebar-slide-out]',
  collectionSidebarCloseButton: '[data-collection-sidebar-close]',
  showMoreOptions: '[data-show-more]',
  groupTagsButton: '[data-aria-toggle]',
  collectionNav: '[data-collection-nav]',
  linkHidden: '[data-link-hidden]',
  underlay: '[data-drawer-underlay]',
  swatch: 'data-swatch',
  animation: '[data-animation]',
};

const classes = {
  animated: 'drawer--animated',
  hiding: 'is-hiding',
  expanded: 'expanded',
  noMobileAnimation: 'no-mobile-animation',
  hidden: 'is-hidden',
  active: 'is-active',
  focused: 'is-focused',
};

let sections = {};
export default class Collection {
  constructor(section) {
    this.container = section.container;
    this.sort = this.container.querySelector(`[${selectors.dataSort}]`);
    this.sortButton = this.container.querySelector(selectors.sortButton);
    this.sortLinks = this.container.querySelectorAll(selectors.sortLinks);
    this.collectionSidebar = this.container.querySelector(selectors.collectionSidebar);
    this.collectionSidebarCloseButtons = this.container.querySelectorAll(selectors.collectionSidebarCloseButton);
    this.groupTagsButton = this.container.querySelector(selectors.groupTagsButton);
    this.collectionNav = this.container.querySelector(selectors.collectionNav);
    this.showMoreOptions = this.container.querySelectorAll(selectors.showMoreOptions);
    this.collectionSidebarHeading = this.container.querySelectorAll(selectors.collectionSidebarHeading);
    this.underlay = this.container.querySelector(selectors.underlay);
    this.swatches = this.container.querySelectorAll(`[${selectors.swatch}]`);
    this.accessibility = a11y;

    this.groupTagsButtonClickEvent = (evt) => this.groupTagsButtonClick(evt);
    this.collectionSidebarCloseEvent = (evt) => this.collectionSidebarClose(evt);
    this.collectionSidebarScrollEvent = () => this.collectionSidebarScroll();
    this.onSortButtonClickEvent = (e) => this.onSortButtonClick(e);
    this.onSortCheckEvent = (e) => this.onSortCheck(e);
    this.sidebarResizeEvent = () => this.toggleSidebarSlider();

    this.init();
  }

  init() {
    if (this.sort) {
      this.initSort();
    }

    if (this.groupTagsButton !== null) {
      document.addEventListener('theme:resize', this.sidebarResizeEvent);

      this.groupTagsButton.addEventListener('click', this.groupTagsButtonClickEvent);

      // Prevent filters closing animation on page load
      if (this.collectionSidebar) {
        setTimeout(() => {
          this.collectionSidebar.classList.remove(classes.noMobileAnimation);
        }, 1000);
      }

      const toggleFiltersObserver = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'attributes') {
            const expanded = mutation.target.ariaExpanded == 'true';

            if (expanded) {
              this.showSidebarCallback();
            }
          }
        }
      });

      toggleFiltersObserver.observe(this.groupTagsButton, {
        attributes: true,
        childList: false,
        subtree: false,
      });
    }

    if (this.collectionSidebarCloseButtons.length) {
      this.collectionSidebarCloseButtons.forEach((button) => {
        button.addEventListener('click', this.collectionSidebarCloseEvent);
      });
    }

    // Hide filters sidebar on ESC keypress
    this.container.addEventListener(
      'keyup',
      function (evt) {
        if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
          return;
        }
        this.hideSidebar();
      }.bind(this)
    );

    // Hide filters sidebar on underlay click
    if (this.underlay) {
      this.underlay.addEventListener('click', this.collectionSidebarCloseEvent);
    }

    // Show more options from the group
    if (this.showMoreOptions) {
      this.showMoreOptions.forEach((element) => {
        element.addEventListener('click', (event) => {
          event.preventDefault();

          element.parentElement.classList.add(classes.hidden);

          element.parentElement.previousElementSibling.querySelectorAll(selectors.linkHidden).forEach((link, index) => {
            link.classList.remove(classes.hidden);
            if (index === 0) {
              window.accessibility.lastFocused = link;
            }
          });

          const collectionSidebarSlideOut = this.container.querySelector(selectors.collectionSidebarSlideOut);
          if (collectionSidebarSlideOut) {
            this.accessibility.removeTrapFocus();
            this.accessibility.trapFocus(this.collectionSidebar, {
              elementToFocus: window.accessibility.lastFocused,
            });
          }
        });
      });
    }

    // Filter accordions events
    if (this.collectionSidebarHeading) {
      this.collectionSidebarHeading.forEach((element) => {
        element.addEventListener('click', (event) => this.collectionAccordion(event));

        element.addEventListener('keyup', (event) => {
          if ((event.code === window.theme.keyboardKeys.SPACE || event.code === window.theme.keyboardKeys.ENTER) && document.body.classList.contains(classes.focused)) {
            window.accessibility.lastFocused = event.currentTarget;
            this.collectionAccordion(event);
          }
        });
      });
    }

    // Init Swatches
    if (this.swatches) {
      this.swatches.forEach((swatch) => {
        new Swatch(swatch);
      });
    }

    if (this.collectionSidebar) {
      this.collectionSidebar.addEventListener('transitionend', () => {
        if (!this.collectionSidebar.classList.contains(classes.expanded)) {
          this.collectionSidebar.classList.remove(classes.animated);
        }
      });

      this.toggleSidebarSlider();
    }
  }

  collectionAccordion(event) {
    event.preventDefault();
    const currentTarget = event.currentTarget;
    const duration = 500;

    currentTarget.classList.toggle(classes.active);

    slideToggle(currentTarget.nextElementSibling, duration);

    if (currentTarget.nextElementSibling.nextElementSibling) {
      slideToggle(currentTarget.nextElementSibling.nextElementSibling, duration);
    }

    const collectionSidebarSlideOut = this.container.querySelector(selectors.collectionSidebarSlideOut);

    if (collectionSidebarSlideOut) {
      const removeTrapFocusOnSlideOut = () => {
        this.accessibility.removeTrapFocus();
        this.accessibility.trapFocus(this.collectionSidebar);
        this.accessibility.trapFocus(this.collectionSidebar, {
          elementToFocus: window.accessibility.lastFocused,
        });

        collectionSidebarSlideOut.removeEventListener('transitionend', removeTrapFocusOnSlideOut);
      };

      collectionSidebarSlideOut.addEventListener('transitionend', removeTrapFocusOnSlideOut);
    }
  }

  collectionSidebarScroll() {
    document.dispatchEvent(
      new CustomEvent('theme:tooltip:close', {
        bubbles: false,
        detail: {
          hideTransition: false,
        },
      })
    );
  }

  sortActions(link, submitForm = true) {
    const sort = link ? link.getAttribute(selectors.sortValue) : '';
    this.sort.setAttribute(selectors.dataSort, sort);

    const sortButtonText = this.sort.querySelector(selectors.sortButtonText);
    const sortActive = this.sort.querySelector(`.${classes.active}`);
    if (sortButtonText) {
      const linkText = link ? link.textContent.trim() : '';
      sortButtonText.textContent = linkText;
    }
    if (sortActive) {
      sortActive.classList.remove(classes.active);
    }
    this.sort.classList.toggle(classes.active, link);

    if (link) {
      link.parentElement.classList.add(classes.active);

      if (submitForm) {
        link.dispatchEvent(
          new CustomEvent('theme:filter:update', {
            bubbles: true,
            detail: {
              href: sort,
            },
          })
        );
      }
    }
  }

  onSortButtonClick(e) {
    e.preventDefault();

    if (this.sortButton) {
      this.sortButton.dispatchEvent(new Event('click'));
    }
    this.sortActions(e.currentTarget);
  }

  onSortCheck(e) {
    let link = null;
    if (window.location.search.includes('sort_by')) {
      const url = new window.URL(window.location.href);
      const urlParams = url.searchParams;

      for (const [key, val] of urlParams.entries()) {
        const linkSort = this.sort.querySelector(`[${selectors.sortValue}="${val}"]`);
        if (key.includes('sort_by') && linkSort) {
          link = linkSort;
          break;
        }
      }
    }

    this.sortActions(link, false);
  }

  initSort() {
    this.sortLinks.forEach((link) => {
      link.addEventListener('click', this.onSortButtonClickEvent);
    });
    this.sort.addEventListener('theme:filter:sort', this.onSortCheckEvent);

    if (this.sortButton) {
      this.sortButton.addEventListener('click', () => {
        const isFiltersSidebarOpen = this.collectionSidebar.classList.contains(classes.expanded);

        if (isMobile() && isFiltersSidebarOpen) {
          this.hideSidebar();
        }
      });
    }
  }

  showSidebarCallback() {
    const collectionSidebarSlider = this.container.querySelector(selectors.collectionSidebarSlider);
    const collectionSidebarSlideOut = this.container.querySelector(selectors.collectionSidebarSlideOut);
    const collectionSidebarScrollable = collectionSidebarSlider || collectionSidebarSlideOut;
    const isScrollLocked = document.documentElement.hasAttribute('data-scroll-locked');

    const isMobileView = isMobile();
    this.collectionSidebar.classList.add(classes.animated);

    if (collectionSidebarSlideOut === null) {
      if (!isMobileView && isScrollLocked) {
        this.accessibility.removeTrapFocus();
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }
    }

    if (isMobileView || collectionSidebarSlideOut !== null) {
      if (collectionSidebarSlideOut) {
        this.accessibility.trapFocus(this.collectionSidebar, {
          elementToFocus: this.collectionSidebar.querySelector(selectors.collectionSidebarCloseButton),
        });
      }
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: collectionSidebarScrollable}));
    }

    if (collectionSidebarScrollable) {
      collectionSidebarScrollable.addEventListener('scroll', this.collectionSidebarScrollEvent);
    }
  }

  hideSidebar() {
    const collectionSidebarSlider = this.container.querySelector(selectors.collectionSidebarSlider);
    const collectionSidebarSlideOut = this.container.querySelector(selectors.collectionSidebarSlideOut);
    const collectionSidebarScrollable = collectionSidebarSlider || collectionSidebarSlideOut;
    const isScrollLocked = document.documentElement.hasAttribute('data-scroll-locked');

    this.groupTagsButton.setAttribute('aria-expanded', 'false');
    this.collectionSidebar.classList.remove(classes.expanded);

    if (collectionSidebarScrollable) {
      collectionSidebarScrollable.removeEventListener('scroll', this.collectionSidebarScrollEvent);
    }

    if (collectionSidebarSlideOut) {
      this.accessibility.removeTrapFocus();
    }

    if (isScrollLocked) {
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
    }
  }

  toggleSidebarSlider() {
    if (isMobile()) {
      this.hideSidebar();
    } else if (this.collectionSidebar.classList.contains(classes.expanded)) {
      this.showSidebarCallback();
    }
  }

  collectionSidebarClose(evt) {
    evt.preventDefault();
    this.hideSidebar();
    if (document.body.classList.contains(classes.focused) && this.groupTagsButton) {
      this.groupTagsButton.focus();
    }
  }

  groupTagsButtonClick() {
    const isScrollLocked = document.documentElement.hasAttribute('data-scroll-locked');

    if (isScrollLocked) {
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
    }
  }

  onUnload(flag = true) {
    if (this.groupTagsButton !== null) {
      document.removeEventListener('theme:resize', this.sidebarResizeEvent);
      this.groupTagsButton.removeEventListener('click', this.groupTagsButtonClickEvent);
    }

    if (this.collectionSidebarCloseButtons.length && flag) {
      this.collectionSidebarCloseButtons.forEach((button) => {
        button.removeEventListener('click', this.collectionSidebarCloseEvent);
      });
    }

    if (this.collectionSidebarScrollable & flag) {
      this.collectionSidebarScrollable.removeEventListener('scroll', this.collectionSidebarScrollEvent);
    }

    if (this.underlay) {
      this.underlay.removeEventListener('click', this.collectionSidebarCloseEvent);
    }

    if (this.sort) {
      this.sortLinks.forEach((link) => {
        link.removeEventListener('click', this.onClickEvent);
      });
      this.sort.removeEventListener('theme:filter:sort', this.onSortCheckEvent);
    }
  }
}

const collectionSection = {
  onLoad() {
    sections[this.id] = new Collection(this);
  },
  onUnload() {
    sections[this.id].onUnload();
  },
};

register('collection', [slider, parallaxHero, collectionSection, popoutSection, swatchGridSection, collectionFiltersForm, tooltipSection, siblings]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
