import {ellipsis} from '../util/ellipsis';
import fadeIn from '../util/fade-in';
import fadeOut from '../util/fade-out';
import hideElement from '../util/hide-element';
import showElement from '../util/show-element';
import scrollTo from '../util/scroll-to';
import {register} from '../vendor/theme-scripts/theme-sections';
import Media from '../media/media';
import pickupAvailability from '../features/pickup-availability';
import {productFormSection} from '../features/product-form';
import {swatchSection} from '../features/swatch';
import {tooltipSection} from '../features/tooltip';
import {popoutSection} from '../features/popout';
import {QuickAddProduct} from '../features/quick-add-product';
import {ComplementaryProducts} from '../features/complementary-products';
import {productStickySection} from '../features/product-sticky';
import {Slider} from '../features/slider';
import accordions from '../features/accordion';
import QuantityCounter from '../globals/quantity-handle';
import tabs from '../features/tabs';
import * as a11y from '../vendor/theme-scripts/theme-a11y';
import {initSlider} from '../media/init-slider';
import {ShareButton} from '../features/share';
import {isDesktop} from '../util/media-query';

const selectors = {
  addToCart: '[data-add-to-cart]',
  priceWrapper: '[data-price-wrapper]',
  productImage: '[data-product-image]',
  productJson: '[data-product-json]',
  form: '[data-product-form]',
  thumbs: '[data-product-thumbs]',
  dataSectionId: 'data-section-id',
  dataCartBar: 'data-cart-bar',
  cartBar: '#cart-bar',
  cartBarAdd: 'data-add-to-cart-bar',
  cartBarScroll: 'data-cart-bar-scroll',
  productSubmitAdd: '.product__submit__add',
  siteFooterWrapper: '.site-footer-wrapper',
  toggleTruncateHolder: '[data-truncated-holder]',
  toggleTruncateButton: '[data-truncated-button]',
  toggleTruncateContent: '[data-truncated-content]',
  toggleTruncateContentAttr: 'data-truncated-content',
  productPopupButton: 'data-product-popup',
  modalScrollContainer: '[data-tabs-holder]',
  formWrapper: '[data-form-wrapper]',
  slider: '[data-slider]',
  sliderIndex: 'data-slider-index',
};

const classes = {
  expanded: 'is-expanded',
  visible: 'is-visible',
  loading: 'is-loading',
  added: 'is-added',
  siteFooterPush: 'site-footer--push',
  hasPopup: 'has-popup',
};

const sections = {};

/**
 * Product section constructor.
 * @param {string} container - selector for the section container DOM element
 */
class Product {
  constructor(section) {
    this.section = section;
    this.container = section.container;
    this.id = this.container.getAttribute(selectors.dataSectionId);
    this.sliders = this.container.querySelectorAll(selectors.slider);
    this.slider = [];
    this.truncateElementHolder = this.container.querySelector(selectors.toggleTruncateHolder);
    this.truncateElement = this.container.querySelector(selectors.toggleTruncateContent);
    this.productPopupButton = this.container.querySelectorAll(`[${selectors.productPopupButton}]`);
    this.formWrapper = this.container.querySelector(selectors.formWrapper);
    this.cartBarExist = this.container.getAttribute(selectors.dataCartBar) === 'true';
    this.cartBar = this.container.querySelector(selectors.cartBar);
    this.scrollToTop = this.scrollToTop.bind(this);
    this.scrollEvent = (e) => this.scrollEvents(e);
    this.resizeEvent = (e) => this.resizeEvents(e);
    this.unlockTimer = 0;
    this.accessibility = a11y;

    if (this.truncateElementHolder && this.truncateElement) {
      setTimeout(() => this.truncateText(), 50);

      document.addEventListener('theme:resize', this.resizeEvent);
    }

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    const productJson = this.container.querySelector(selectors.productJson);
    if ((productJson && !productJson.innerHTML) || !productJson) {
      const counter = new QuantityCounter(this.container);
      counter.init();
      return;
    }
    const productJsonHandle = JSON.parse(productJson.innerHTML).handle;
    let recentObj = {};
    if (productJsonHandle) {
      recentObj = {
        handle: productJsonHandle,
      };
    }

    // Record recently viewed products when the product page is loading
    Shopify.Products.recordRecentlyViewed(recentObj);

    this.form = this.container.querySelector(selectors.form);

    this.init();

    if (this.sliders.length) {
      this.sliders.forEach((slider, index) => {
        slider.setAttribute(selectors.sliderIndex, index);
        this.slider.push(new Slider(this.container, slider));
      });
    }

    if (this.cartBarExist) {
      this.initCartBar();
      document.addEventListener('theme:scroll', this.scrollEvent);
    }

    if (this.productPopupButton.length > 0) {
      this.productPopup();
    }
  }

  init() {
    theme.mediaInstances[this.id] = new Media(this.section);
    theme.mediaInstances[this.id].init();
  }

  scrollEvents(e) {
    if (this.cartBarExist) {
      this.cartBarScroll();
    }
  }

  resizeEvents(e) {
    this.truncateText();
  }

  productPopup() {
    this.productPopupButton.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.querySelector(`#${button.getAttribute(selectors.productPopupButton)}`);
        const modalScrollContainer = modal.querySelector(selectors.modalScrollContainer);

        if (window.getComputedStyle(modal).display !== 'none') {
          fadeOut(modal);
          this.formWrapper.classList.remove(classes.hasPopup);
          this.accessibility.removeTrapFocus();

          if (this.unlockTimer) {
            clearTimeout(this.unlockTimer);
          }
          // delay scroll unlock to prevent content shifting
          this.unlockTimer = setTimeout(() => {
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
          }, 300);
        }

        if (window.getComputedStyle(modal).display === 'none') {
          fadeIn(modal);
          this.formWrapper.classList.add(classes.hasPopup);
          document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: modalScrollContainer}));
          this.accessibility.trapFocus(modal);
        }
      });
    });
  }

  truncateText() {
    if (this.truncateElementHolder.classList.contains(classes.visible)) return;
    const styles = this.truncateElement.querySelectorAll('style');
    if (styles.length) {
      styles.forEach((style) => {
        this.truncateElementHolder.prepend(style);
      });
    }

    const truncateElementCloned = this.truncateElement.cloneNode(true);
    const truncateElementClass = this.truncateElement.getAttribute(selectors.toggleTruncateContentAttr);
    const truncateNextElement = this.truncateElement.nextElementSibling;
    if (truncateNextElement) {
      truncateNextElement.remove();
    }

    this.truncateElement.parentElement.append(truncateElementCloned);

    const truncateAppendedElement = this.truncateElement.nextElementSibling;
    truncateAppendedElement.classList.add(truncateElementClass);
    truncateAppendedElement.removeAttribute(selectors.toggleTruncateContentAttr);

    showElement(truncateAppendedElement);

    ellipsis(truncateAppendedElement, 5, {
      replaceStr: '',
      delimiter: ' ',
    });

    hideElement(truncateAppendedElement);

    if (this.truncateElement.innerHTML !== truncateAppendedElement.innerHTML) {
      this.truncateElementHolder.classList.add(classes.expanded);
    } else {
      truncateAppendedElement.remove();
      this.truncateElementHolder.classList.remove(classes.expanded);
    }

    this.toggleTruncatedContent(this.truncateElementHolder);
  }

  toggleTruncatedContent(holder) {
    const toggleButton = holder.querySelector(selectors.toggleTruncateButton);
    if (toggleButton) {
      toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        holder.classList.remove(classes.expanded);
        holder.classList.add(classes.visible);
      });
    }
  }

  initCartBar() {
    // Submit product form on cart bar button click
    this.cartBarBtn = this.cartBar.querySelector(selectors.productSubmitAdd);
    if (this.cartBarBtn) {
      this.cartBarBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (e.currentTarget.hasAttribute(selectors.cartBarAdd)) {
          if (theme.settings.cartDrawerEnabled) {
            e.currentTarget.classList.add(classes.loading);
            e.currentTarget.setAttribute('disabled', 'disabled');
          }

          this.form.querySelector(selectors.addToCart).dispatchEvent(
            new Event('click', {
              bubbles: true,
            })
          );
        } else if (e.currentTarget.hasAttribute(selectors.cartBarScroll)) {
          this.scrollToTop();
        }
      });

      if (this.cartBarBtn.hasAttribute(selectors.cartBarAdd)) {
        document.addEventListener('theme:product:add-error', this.scrollToTop);
      }
    }
  }

  scrollToTop() {
    const scrollTarget = isDesktop() ? this.container : this.form;

    scrollTo(scrollTarget.getBoundingClientRect().top);
  }

  cartBarScroll() {
    const scrolled = window.pageYOffset;
    const element = theme.variables.productPageSticky && this.formWrapper ? this.formWrapper : this.form;

    if (element && this.cartBar) {
      const siteFooter = document.querySelector(selectors.siteFooterWrapper);
      const formOffset = element.offsetTop;
      const formHeight = element.offsetHeight;
      const checkPosition = scrolled > formOffset + formHeight;

      this.cartBar.classList.toggle(classes.visible, checkPosition);

      if (siteFooter) {
        siteFooter.classList.toggle(classes.siteFooterPush, checkPosition);
        siteFooter.style.marginBottom = siteFooter.classList.contains(classes.siteFooterPush) ? `${this.cartBar.offsetHeight}px` : '0';
      }
    }
  }

  onUnload() {
    document.removeEventListener('theme:product:add-error', this.scrollToTop);

    if (this.truncateElementHolder && this.truncateElement) {
      document.removeEventListener('theme:resize', this.resizeEvent);
    }

    if (this.cartBarExist) {
      document.removeEventListener('theme:scroll', this.scrollEvent);
    }
  }

  onBlockSelect(e) {
    const slider = e.srcElement.closest(selectors.slider);
    if (slider && this.slider.length) {
      const sliderIndex = slider.hasAttribute(selectors.sliderIndex) ? slider.getAttribute(selectors.sliderIndex) : 0;
      if (!this.slider[sliderIndex]) return;
      this.slider[sliderIndex].onBlockSelect(e);
    }
  }

  onBlockDeselect(e) {
    const slider = e.srcElement.closest(selectors.slider);
    if (slider && this.slider.length) {
      const sliderIndex = slider.hasAttribute(selectors.sliderIndex) ? slider.getAttribute(selectors.sliderIndex) : 0;
      if (!this.slider[sliderIndex]) return;
      this.slider[sliderIndex].onBlockDeselect(e);
    }
  }
}

const productSection = {
  onLoad() {
    sections[this.id] = new Product(this);
  },
  onUnload(e) {
    sections[this.id].onUnload(e);
  },
  onBlockSelect(e) {
    sections[this.id].onBlockSelect(e);
  },
  onBlockDeselect(e) {
    sections[this.id].onBlockDeselect(e);
  },
};

register('product', [productSection, pickupAvailability, productFormSection, swatchSection, tooltipSection, popoutSection, tabs, accordions, productStickySection, initSlider]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}

if (!customElements.get('complementary-products')) {
  customElements.define('complementary-products', ComplementaryProducts);
}

if (!customElements.get('share-button')) {
  customElements.define('share-button', ShareButton);
}
