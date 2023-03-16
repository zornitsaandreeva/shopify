import MicroModal from 'micromodal';

import {trapFocus, removeTrapFocus} from '../vendor/theme-scripts/theme-a11y';
import Media from '../media/media';
import FetchError from '../util/fetch-error';
import throttle from '../util/throttle';
import wrapElements from '../globals/wrap';
import {InitSlider} from '../media/init-slider';

import {ProductAddForm} from './product-form';
import {Popout} from './popout';
import {Swatch} from './swatch';
import Tooltip from './tooltip';

const classes = {
  added: 'is-added',
  animated: 'is-animated',
  disabled: 'is-disabled',
  error: 'has-error',
  hide: 'is-hidden',
  hiding: 'is-hiding',
  loading: 'is-loading',
  open: 'is-open',
  overlayText: 'product-item--overlay-text',
  visible: 'is-visible',
  siblingLinkCurrent: 'sibling__link--current',
  focused: 'is-focused',
};

const settings = {
  errorDelay: 3000,
  animationDelay: 500,
};

const selectors = {
  addButtonWrapper: '[data-add-action-wrapper]',
  animation: '[data-animation]',
  apiContent: '[data-api-content]',
  buttonQuickAdd: '[data-quick-add-btn]',
  buttonQuickAddText: '[data-quick-add-btn-text]',
  buttonQuickAddMobile: '[data-quick-add-btn-mobile]',
  cartDrawer: '[data-cart-drawer]',
  cartLineItems: '[data-line-items]',
  focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
  media: '[data-media-slide]',
  messageError: '[data-message-error]',
  modalContainer: '[data-product-upsell-container]',
  modalContent: '[data-product-upsell-ajax]',
  productGridItem: 'data-product-grid-item',
  productInformationHolder: '[data-product-information]',
  popoutWrapper: '[data-popout]',
  quickAddHolder: 'data-quick-add-holder',
  quickAddModal: '[data-quick-add-modal]',
  quickAddModalTemplate: '[data-quick-add-modal-template]',
  quickAddVariant: 'data-quick-add-variant',
  quickAddProp: 'data-quick-add-props',
  siblingSwapper: 'data-sibling-swapper',
  swatch: '[data-swatch]',
  tooltip: '[data-tooltip]',
};

class QuickAddProduct extends HTMLElement {
  constructor() {
    super();

    this.container = this;
    this.quickAddHolder = this.container.querySelector(`[${selectors.quickAddHolder}]`);

    if (this.quickAddHolder) {
      this.html = document.documentElement;
      this.isCartItem = Boolean(this.quickAddHolder.closest(selectors.cartLineItems));
      this.modalTemplate = this.quickAddHolder.querySelector(selectors.quickAddModalTemplate);
      this.modal = document.querySelector(selectors.quickAddModal);
      this.modalID = this.quickAddHolder.getAttribute(selectors.quickAddHolder);
      this.modalButton = this.quickAddHolder.querySelector(`[data-popup-${this.modalID}]`);
      this.handle = this.modalButton ? this.modalButton.getAttribute(`data-popup-${this.modalID}`) : null;
      this.cartDrawer = document.querySelector(selectors.cartDrawer);
      this.buttonQuickAdd = this.quickAddHolder.querySelector(selectors.buttonQuickAdd);
      this.button = this.modalButton || this.buttonQuickAdd;
      this.buttonQuickAddMobile = this.quickAddHolder.querySelector(selectors.buttonQuickAddMobile);
      this.closeTooltipEvent = () => throttle(this.closeTooltip(), 50);
      this.oldModalID = null;
      this.modalContainer = null;
      this.modalContent = null;

      if (!this.modal && this.modalTemplate) {
        const modalTemplateInner = this.modalTemplate.innerHTML;
        const htmlObject = document.createElement('div');
        htmlObject.innerHTML = modalTemplateInner;
        const modalHtml = htmlObject.querySelector(selectors.quickAddModal);
        document.body.appendChild(modalHtml);
        this.modal = document.querySelector(selectors.quickAddModal);
      }

      this.init();
    }
  }

  init() {
    /**
     * Modal button works for multiple variants products
     */
    if (this.modalButton && this.modalTemplate) {
      this.modalButton.addEventListener('click', (e) => {
        e.preventDefault();
        const isSiblingSwapper = this.modalButton.hasAttribute(selectors.siblingSwapper);
        const isSiblingLinkCurrent = this.modalButton.classList.contains(classes.siblingLinkCurrent);

        if (isSiblingLinkCurrent) return;

        this.modalButton.classList.add(classes.loading);
        this.modalButton.disabled = true;
        this.closeTooltip();

        if (isSiblingSwapper && !isSiblingLinkCurrent) {
          this.modalContainer = document.querySelector(selectors.modalContainer);
          this.modalContainer.classList.add(classes.loading);
          this.hideAnimatedItems();
        }

        if (this.modal) {
          this.oldModalID = this.modal.id;

          if (this.modalID) {
            this.modal.id = this.modalID;
          }
        }

        this.getProductHTML();
      });
    }

    /**
     * Quick add button works for single variant products
     */

    if (this.buttonQuickAdd) {
      const buttonQuickAddText = this.buttonQuickAdd.querySelector(selectors.buttonQuickAddText);

      if (buttonQuickAddText && parseInt(getComputedStyle(this.buttonQuickAdd).getPropertyValue('--btn-text-width')) === 0) {
        this.buttonQuickAdd.style.setProperty('--btn-text-width', `${buttonQuickAddText.clientWidth}px`);
      }

      if (this.buttonQuickAdd.hasAttribute(selectors.quickAddVariant)) {
        this.buttonQuickAdd.addEventListener('click', (e) => {
          e.preventDefault();
          const variantID = this.buttonQuickAdd.getAttribute(selectors.quickAddVariant);

          if (variantID) {
            const props = this.buttonQuickAdd.hasAttribute(selectors.quickAddProp) ? JSON.parse(this.buttonQuickAdd.getAttribute(selectors.quickAddProp).replaceAll("'", '"')) : null;

            this.addToCart(variantID, props);
          }
        });

        if (theme.settings.enableQuickAdd && this.buttonQuickAdd.closest(`[${selectors.quickAddHolder}]`)) {
          this.errorHandler();
        }
      }
    }

    if (this.buttonQuickAddMobile) {
      this.buttonQuickAddMobile.addEventListener('click', () => {
        this.buttonQuickAddMobile.classList.add(classes.loading);
        this.button.dispatchEvent(new Event('click'));
      });
    }

    if (this.quickAddHolder) {
      this.quickAddHolder.addEventListener('animationend', () => {
        if (this.quickAddHolder.classList.contains(classes.disabled)) {
          this.quickAddHolder.classList.remove(classes.disabled);
        }
      });
    }

    document.addEventListener('theme:product:added', () => {
      this.resetQuickAddButtons();

      if (this.modal && this.modal.classList.contains(classes.open)) {
        MicroModal.close(this.modalID);
      }
    });
  }

  addToCart(id, props = null) {
    const label = this.buttonQuickAdd.closest(selectors.quickAddHolder) ? this.buttonQuickAdd : null;
    let data = {
      id: id,
      quantity: 1,
    };

    if (props) {
      const propertiesObj = {
        properties: props,
      };
      data = {...data, ...propertiesObj};
    }

    document.dispatchEvent(
      new CustomEvent('theme:cart:add', {
        bubbles: true,
        detail: {
          element: this.quickAddHolder,
          label,
          button: this.buttonQuickAdd,
          data,
        },
      })
    );
  }

  /**
   * Handle error cart response
   */
  errorHandler() {
    this.quickAddHolder.addEventListener('theme:cart:error', (event) => {
      const holder = event.detail.holder;
      const parentProduct = holder.closest(`[${selectors.productGridItem}]`);
      if (!parentProduct) return;
      const errorMessageHolder = holder.querySelector(selectors.messageError);
      const hasOverlayText = parentProduct.classList.contains(classes.overlayText);
      const productInfo = parentProduct.querySelector(selectors.productInformationHolder);
      const button = holder.querySelector(selectors.buttonQuickAdd);
      const buttonQuickAddMobile = holder.querySelector(selectors.buttonQuickAddMobile);

      if (button) {
        button.classList.remove(classes.added, classes.loading);
        button.classList.add(classes.error);
      }

      if (buttonQuickAddMobile) {
        buttonQuickAddMobile.classList.remove(classes.added, classes.loading);
        buttonQuickAddMobile.classList.add(classes.error);
      }

      if (errorMessageHolder) {
        errorMessageHolder.innerText = event.detail.description;
      }

      if (hasOverlayText) {
        productInfo.classList.add(classes.hidden);
      }

      setTimeout(() => {
        this.resetQuickAddButtons();

        if (hasOverlayText) {
          productInfo.classList.remove(classes.hidden);
        }
      }, settings.errorDelay);
    });
  }

  /**
   * Reset buttons to default states
   */
  resetQuickAddButtons() {
    if (this.quickAddHolder) {
      this.quickAddHolder.classList.remove(classes.visible);
    }

    if (this.button) {
      this.buttonQuickAdd.classList.remove(classes.added, classes.error);
      this.buttonQuickAdd.disabled = false;
    }

    if (this.buttonQuickAddMobile) {
      this.buttonQuickAddMobile.classList.remove(classes.added, classes.error);
      this.buttonQuickAddMobile.disabled = false;
    }
  }

  getProductHTML() {
    if (this.modalContent && this.oldModalID === this.modalID) {
      this.modalCreate();
    } else {
      window
        .fetch(`${window.theme.routes.root}products/${this.handle}?section_id=api-product-upsell`)
        .then(this.upsellErrorsHandler)
        .then((response) => {
          return response.text();
        })
        .then((response) => {
          const fresh = document.createElement('div');
          fresh.innerHTML = response;
          this.modalContent = document.querySelector(selectors.modalContent);
          this.modalContent.innerHTML = fresh.querySelector(selectors.apiContent).innerHTML;

          this.initFormFunctionalities();
          this.modalCreate();
        });
    }
  }

  initFormFunctionalities() {
    new ProductAddForm(null, this.modal);

    new InitSlider(null, this.modal);

    const swatchElements = this.modalContent.querySelectorAll(selectors.swatch);
    if (swatchElements.length) {
      swatchElements.forEach((el) => {
        new Swatch(el);
      });
    }

    const wrappers = this.modalContent.querySelectorAll(selectors.popoutWrapper);
    if (wrappers.length) {
      wrappers.forEach((wrapper) => {
        new Popout(wrapper);
      });
    }

    const tooltips = this.modalContent.querySelectorAll(selectors.tooltip);
    if (tooltips.length) {
      tooltips.forEach((tooltip) => {
        new Tooltip(tooltip);
      });
    }

    wrapElements(this.modalContent);
  }

  modalCreate() {
    this.modalContainer = document.querySelector(selectors.modalContainer);

    MicroModal.show(this.modalID, {
      onShow: (modal, el, event) => {
        const firstFocus = modal.querySelector(selectors.focusable);
        const mediaObject = {
          container: modal,
          id: this.modalID,
        };

        theme.mediaInstances[this.id] = new Media(mediaObject);
        theme.mediaInstances[this.id].init();

        this.quickAddHolder.classList.add(classes.disabled);

        if (this.modalButton) {
          this.modalButton.classList.remove(classes.loading);
          this.modalButton.disabled = false;
        }

        if (this.buttonQuickAddMobile) {
          this.buttonQuickAddMobile.classList.remove(classes.loading);
          this.buttonQuickAddMobile.disabled = false;
        }

        // Animate items
        requestAnimationFrame(() => {
          this.modalContainer.querySelectorAll(selectors.animation).forEach((item) => {
            item.classList.add(classes.animated);
          });

          // Reset loading state after animations complete
          setTimeout(() => {
            this.modalContainer.classList.remove(classes.loading);
          }, settings.animationDelay);
        });

        setTimeout(() => {
          trapFocus(modal, {elementToFocus: firstFocus});
        }, settings.animationDelay);

        document.dispatchEvent(new CustomEvent('theme:quick-add:open', {bubbles: true}));
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.modalContainer}));

        this.modalContainer.addEventListener('scroll', this.closeTooltipEvent);
      },
      onClose: (modal, el, event) => {
        if (event) {
          event.preventDefault();
        }

        const allMedia = modal.querySelectorAll(selectors.media);

        allMedia.forEach((media) => {
          media.dispatchEvent(new CustomEvent('pause'));
        });

        if (this.modalButton) {
          this.modalButton.disabled = false;
        }

        if (this.buttonQuickAddMobile) {
          this.buttonQuickAddMobile.disabled = false;
        }

        if (this.quickAddHolder && this.quickAddHolder.classList.contains(classes.disabled)) {
          this.quickAddHolder.classList.remove(classes.disabled);
        }

        removeTrapFocus();

        if (document.body.classList.contains(classes.focused) && this.buttonQuickAdd) {
          this.buttonQuickAdd.classList.add(classes.visible);
          setTimeout(() => {
            this.buttonQuickAdd.focus();
            this.buttonQuickAdd.classList.remove(classes.visible);
          }, 50);
        }
        this.resetAnimatedItems();

        if (!this.cartDrawer || !this.cartDrawer.classList.contains(classes.open)) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }

        this.modalContainer.removeEventListener('scroll', this.closeTooltipEvent);
      },
    });
  }

  closeTooltip() {
    document.dispatchEvent(
      new CustomEvent('theme:tooltip:close', {
        bubbles: false,
        detail: {
          hideTransition: true,
        },
      })
    );
  }

  upsellErrorsHandler(response) {
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

  hideAnimatedItems() {
    if (!this.modalContainer) return;

    this.modalContainer.querySelectorAll(selectors.animation).forEach((item) => {
      item.classList.add(classes.hiding);
    });
  }

  resetAnimatedItems() {
    if (!this.modalContainer) return;

    this.modalContainer.querySelectorAll(selectors.animation).forEach((item) => {
      item.classList.remove(classes.animated);
    });
  }
}

export {QuickAddProduct};
