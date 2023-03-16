import * as a11y from '../vendor/theme-scripts/theme-a11y';

const selectors = {
  details: 'details',
  popdown: '[data-popdown]',
  popdownClose: '[data-popdown-close]',
  popdownToggle: '[data-popdown-toggle]',
  input: 'input:not([type="hidden"])',
};

const attributes = {
  popdownUnderlay: 'data-popdown-underlay',
};

class SearchPopdown extends HTMLElement {
  constructor() {
    super();
    this.popdown = this.querySelector(selectors.popdown);
    this.popdownContainer = this.querySelector(selectors.details);
    this.popdownToggle = this.querySelector(selectors.popdownToggle);
    this.popdownClose = this.querySelector(selectors.popdownClose);
    this.a11y = a11y;
  }

  connectedCallback() {
    this.popdownContainer.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
    this.popdownClose.addEventListener('click', this.close.bind(this));
    this.popdownToggle.addEventListener('click', this.onPopdownToggleClick.bind(this));
    this.popdownToggle.setAttribute('role', 'button');
    this.popdown.addEventListener('transitionend', (event) => {
      if (event.propertyName == 'visibility' && this.popdownContainer.hasAttribute('open') && this.popdownContainer.getAttribute('open') == 'false') {
        this.popdownContainer.removeAttribute('open');
      }
    });
  }

  onPopdownToggleClick(event) {
    event.preventDefault();
    event.target.closest(selectors.details).hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.hasAttribute(attributes.popdownUnderlay)) this.close();
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest(selectors.details).setAttribute('open', '');

    document.body.addEventListener('click', this.onBodyClickEvent);
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popdown}));

    // Safari opening transition fix
    requestAnimationFrame(() => {
      event.target.closest(selectors.details).setAttribute('open', 'true');
      this.a11y.trapFocus(this.popdown, {
        elementToFocus: this.popdown.querySelector(selectors.input),
      });
    });
  }

  close() {
    this.a11y.removeTrapFocus();
    this.popdownContainer.setAttribute('open', 'false');

    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }
}

customElements.define('header-search-popdown', SearchPopdown);
