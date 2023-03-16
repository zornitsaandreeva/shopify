import * as a11y from '../vendor/theme-scripts/theme-a11y';
import FetchError from '../util/fetch-error';

const selectors = {
  pickupContainer: 'data-store-availability-container',
  shopifySection: '.shopify-section',
  drawer: '[data-pickup-drawer]',
  drawerBody: '[data-pickup-drawer-body]',
  drawerOpen: '[data-pickup-drawer-open]',
  drawerClose: '[data-pickup-drawer-close]',
  drawerUnderlay: '[data-drawer-underlay]',
  body: 'body',
};

const classes = {
  isOpen: 'is-open',
  isHidden: 'hidden',
  isFocused: 'is-focused',
};

let sections = {};

class PickupAvailability {
  constructor(section) {
    this.container = section.container;
    this.drawer = null;
    this.drawerBody = null;
    this.buttonDrawerOpen = null;
    this.buttonDrawerClose = null;
    this.body = document.querySelector(selectors.body);
    this.a11y = a11y;

    this.container.addEventListener('theme:variant:change', (event) => this.fetchPickupAvailability(event));

    this.closeEvent();
  }

  fetchPickupAvailability(event) {
    const container = this.container.querySelector(`[${selectors.pickupContainer}]`);
    if (!container) return;
    if ((event && !event.detail.variant) || (event && event.detail.variant && !event.detail.variant.available)) {
      container.classList.add(classes.isHidden);
      return;
    }
    const variantID = event && event.detail.variant ? event.detail.variant.id : container.getAttribute(selectors.pickupContainer);
    this.drawer = this.body.querySelector(selectors.drawer);

    // Remove cloned instances of pickup drawer
    if (this.drawer) {
      this.body.removeChild(this.drawer);
    }

    if (variantID) {
      fetch(`${window.theme.routes.root}variants/${variantID}/?section_id=api-pickup-availability`)
        .then(this.handleErrors)
        .then((response) => response.text())
        .then((text) => {
          const pickupAvailabilityHTML = new DOMParser().parseFromString(text, 'text/html').querySelector(selectors.shopifySection).innerHTML;
          container.innerHTML = pickupAvailabilityHTML;

          this.drawer = this.container.querySelector(selectors.drawer);
          if (!this.drawer) {
            container.classList.add(classes.isHidden);
            return;
          }
          // Clone Pickup drawer and append it to the end of <body>
          this.clone = this.drawer.cloneNode(true);
          this.body.appendChild(this.clone);

          // Delete the original instance of pickup drawer
          container.classList.remove(classes.isHidden);
          container.removeChild(this.drawer);

          this.drawer = this.body.querySelector(selectors.drawer);
          this.drawerBody = this.body.querySelector(selectors.drawerBody);
          this.buttonDrawerOpen = this.body.querySelector(selectors.drawerOpen);
          this.buttonDrawerClose = this.body.querySelectorAll(selectors.drawerClose);

          if (this.buttonDrawerOpen) {
            this.buttonDrawerOpen.addEventListener('click', () => {
              this.openDrawer();

              window.accessibility.lastElement = this.buttonDrawerOpen;
            });
          }

          if (this.buttonDrawerClose.length) {
            this.buttonDrawerClose.forEach((element) => {
              element.addEventListener('click', () => this.closeDrawer());
            });
          }

          this.drawer.addEventListener('keyup', (evt) => {
            if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
              return;
            }
            this.closeDrawer();
          });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  openDrawer() {
    if (this.drawer) {
      this.drawer.classList.add(classes.isOpen);
      this.drawer.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.drawerBody}));

      // Focus the close button on pickup drawer close
      setTimeout(() => {
        const elementToFocus = this.drawer.querySelector(selectors.drawerClose);
        this.a11y.removeTrapFocus();
        this.a11y.trapFocus(this.drawer, {
          elementToFocus: elementToFocus,
        });
      }, 200);
    }
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.classList.remove(classes.isOpen);
      this.drawer.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: this.drawerBody}));
      this.a11y.removeTrapFocus();

      // Focus the last element on pickup drawer close
      if (window.accessibility.lastElement && this.body.classList.contains(classes.isFocused)) {
        requestAnimationFrame(() => {
          window.accessibility.lastElement.focus();
        });
      }
    }
  }

  /**
   * Body click event to close pickup drawer
   *
   * @return  {Void}
   */
  closeEvent() {
    document.addEventListener('click', (event) => {
      const clickedElement = event.target;
      const isNotDrawerUnderlay = !(clickedElement.matches(selectors.drawerUnderlay) || clickedElement.closest(selectors.drawerUnderlay));
      const isNotDrawerOrDrawerChild = !(clickedElement.matches(selectors.drawerOpen) || clickedElement.closest(selectors.drawer)) || !isNotDrawerUnderlay;

      if (isNotDrawerOrDrawerChild && this.drawer?.classList.contains(classes.isOpen)) {
        this.closeDrawer();
      }
    });
  }

  handleErrors(response) {
    if (!response.ok) {
      return response.json().then(function (json) {
        const e = new FetchError({
          status: response.statusText,
          headers: response.headers,
          json: json,
        });
        throw e;
      });
    }
    return response;
  }
}

const pickupAvailability = {
  onLoad() {
    sections[this.id] = new PickupAvailability(this);
  },
};

export default pickupAvailability;
