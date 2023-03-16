import {formatMoney} from '@shopify/theme-currency';

import * as a11y from '../vendor/theme-scripts/theme-a11y';
import FetchError from '../util/fetch-error';

import isVisible from './is-visible';
import QuantityCounter from './quantity-handle';

const classes = {
  animated: 'is-animated',
  active: 'is-active',
  added: 'is-added',
  disabled: 'is-disabled',
  error: 'has-error',
  headerStuck: 'js__header__stuck',
  hidden: 'is-hidden',
  hiding: 'is-hiding',
  loading: 'is-loading',
  open: 'is-open',
  removed: 'is-removed',
  success: 'is-success',
  visible: 'is-visible',
  focused: 'is-focused',
  expanded: 'is-expanded',
  updated: 'is-updated',
};

const selectors = {
  apiContent: '[data-api-content]',
  apiLineItems: '[data-api-line-items]',
  apiUpsellItems: '[data-api-upsell-items]',
  animation: '[data-animation]',
  additionalCheckoutButtons: '.additional-checkout-buttons',
  burgerButton: '[data-drawer-toggle]',
  buttonAddToCart: '[data-add-to-cart]',
  buttonQuickAddMobile: '[data-quick-add-btn-mobile]',
  buttonHolder: '[data-foot-holder]',
  buttonSkipUpsellProduct: '[data-skip-upsell-product]',
  cartBarAdd: '[data-add-to-cart-bar]',
  cartCloseError: '[data-cart-error-close]',
  cartDiscountsHolder: '[data-cart-discounts-holder]',
  cartDrawer: '[data-cart-drawer]',
  cartDrawerBody: '[data-cart-drawer-body]',
  cartEmpty: '[data-cart-empty]',
  cartErrors: '[data-cart-errors]',
  cartItemRemove: '[data-item-remove]',
  cartOriginalTotal: '[data-cart-original-total]',
  cartOriginaTotalPrice: '[data-cart-original-total-price]',
  cartPage: '[data-cart-page]',
  cartToggleElement: '[data-cart-toggle]',
  cartTotal: '[data-cart-total]',
  cartTotalDiscountsTemplate: '[data-cart-total-discount-template]',
  cartTotalDiscountTitle: '[data-cart-discount-title]',
  cartTotalDiscountAmount: '[data-cart-discount-price]',
  cartWidget: '[data-cart-widget]',
  cartWidgetContent: '[data-cart-widget-content]',
  expandButton: '[data-expand-button]',
  errorMessage: '[data-error-message]',
  formCloseError: '[data-close-error]',
  formErrorsContainer: '[data-cart-errors-container]',
  freeShipping: '[data-free-shipping]',
  freeShippingGraph: '[data-progress-graph]',
  freeShippingProgress: '[data-progress-bar]',
  headerWrapper: '[data-header-wrapper]',
  item: '[data-item]',
  itemsHolder: '[data-items-holder]',
  leftToSpend: '[data-left-to-spend]',
  navDrawer: '[data-drawer]',
  outerSection: '[data-section-id]',
  upsellProductsHolder: '[data-upsell-products]',
  quickAddHolder: '[data-quick-add-holder]',
  quickAddModal: '[data-quick-add-modal]',
  qtyInput: '[data-quantity-field]',
  drawerUnderlay: '[data-drawer-underlay]',
};

const attributes = {
  disabled: 'disabled',
  quickAddHolder: 'data-quick-add-holder',
  quickAddVariant: 'data-quick-add-variant',
  freeShipping: 'data-free-shipping',
  freeShippingLimit: 'data-free-shipping-limit',
};

const settings = {
  cartDrawerEnabled: window.theme.settings.cartDrawerEnabled,
  times: {
    timeoutAnimationComplete: 500,
    timeoutButtonReset: 1000,
  },
};

class CartDrawer {
  constructor() {
    if (window.location.pathname.endsWith('/password')) {
      return;
    }

    this.init();
  }

  init() {
    // DOM Elements
    this.html = document.documentElement;
    this.body = document.body;
    this.cartPage = document.querySelector(selectors.cartPage);
    this.cartDrawer = document.querySelector(selectors.cartDrawer);
    this.cartDrawerBody = document.querySelector(selectors.cartDrawerBody);
    this.cartEmpty = document.querySelector(selectors.cartEmpty);
    this.buttonHolder = document.querySelector(selectors.buttonHolder);
    this.itemsHolder = document.querySelector(selectors.itemsHolder);
    this.items = document.querySelectorAll(selectors.item);
    this.cartTotal = document.querySelector(selectors.cartTotal);
    this.freeShipping = document.querySelectorAll(selectors.freeShipping);
    this.cartOriginalTotal = document.querySelector(selectors.cartOriginalTotal);
    this.cartOriginaTotalPrice = document.querySelector(selectors.cartOriginaTotalPrice);
    this.cartDiscountHolder = document.querySelector(selectors.cartDiscountsHolder);
    this.expandButton = document.querySelectorAll(selectors.expandButton);
    this.cartTotalDiscountTemplate = document.querySelector(selectors.cartTotalDiscountsTemplate).innerHTML;
    this.cartErrorHolder = document.querySelector(selectors.cartErrors);
    this.cartCloseErrorMessage = document.querySelector(selectors.cartCloseError);
    this.headerWrapper = document.querySelector(selectors.headerWrapper);
    this.accessibility = a11y;
    this.navDrawer = document.querySelector(selectors.navDrawer);
    this.upsellProductsHolder = document.querySelector(selectors.upsellProductsHolder);

    // Define Cart object depending on if we have cart drawer or cart page
    this.cart = this.cartDrawer || this.cartPage;

    this.form = null;

    this.build = this.build.bind(this);

    // AJAX request
    this.addToCart = this.addToCart.bind(this);
    this.updateCart = this.updateCart.bind(this);
    this.addToCartCallback = this.addToCartCallback.bind(this);
    this.productAddCallback = this.productAddCallback.bind(this);

    // Cart events
    this.openCartDrawer = this.openCartDrawer.bind(this);
    this.closeCartDrawer = this.closeCartDrawer.bind(this);
    this.toggleCartDrawer = this.toggleCartDrawer.bind(this);
    this.openCartDrawerOnProductAdded = this.openCartDrawerOnProductAdded.bind(this);
    this.animateItems = this.animateItems.bind(this);
    this.requestItemsAnimationFrame = this.requestItemsAnimationFrame.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.cartAnimationTimeout = 0;

    // Upsell products
    this.skipUpsellProductsArray = [];
    this.skipUpsellProductEvent();
    this.checkSkippedUpsellProductsFromStorage();
    this.toggleCartUpsellWidgetVisibility();

    // Checking
    this.hasItemsInCart = this.hasItemsInCart.bind(this);

    // Set classes
    this.toggleClassesOnContainers = this.toggleClassesOnContainers.bind(this);

    // Cart variables
    this.subtotal = window.theme.subtotal;

    // Flags
    this.totalItems = this.items.length;
    this.cartDrawerIsOpen = false;
    this.cartDiscounts = 0;
    this.cartDrawerEnabled = settings.cartDrawerEnabled;
    this.cartUpdateFailed = false;

    // Cart Events
    this.cartToggleEvents();
    this.expandEvents();
    this.cartEvents();
    this.cartEventAdd();
    this.cartEventRemoveError();

    // Init quantity for fields
    this.initQuantity();

    // Init estimate shipping calculator
    this.estimateShippingCalculator();

    // Attributes
    this.circumference = 28 * Math.PI; // radius - stroke * 4 * PI
    this.cartFreeShippingLimit = 0;

    this.freeShippingMessageHandle(this.subtotal);
    this.updateProgress();

    document.addEventListener('theme:cart:add', this.addToCartCallback);
    document.addEventListener('theme:cart:loaded', this.requestItemsAnimationFrame);
    document.addEventListener('theme:quick-add:open', this.closeCartDrawer);
    document.addEventListener('theme:product:add', this.productAddCallback);
    document.addEventListener('theme:product:add-error', this.productAddCallback);
    document.addEventListener('theme:product:added', this.openCartDrawerOnProductAdded);
    document.addEventListener('theme:announcement:init', this.updateProgress);
  }

  /**
   * Init quantity field functionality
   *
   * @return  {Void}
   */

  initQuantity() {
    this.items = document.querySelectorAll(selectors.item);

    this.items.forEach((item) => {
      const initQuantity = new QuantityCounter(item, true);

      initQuantity.init();
      this.cartUpdateEvent(item);
    });
  }

  /**
   * Expand blocks and close siblings
   *
   * @return  {Void}
   */

  expandEvents() {
    const widgets = document.querySelectorAll(selectors.cartWidget);

    this.expandButton.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();

        const widget = document.querySelector(item.getAttribute('href'));

        item.classList.toggle(classes.active);
        widget.classList.toggle(classes.expanded);

        if (widgets.length > 1) {
          widgets.forEach((content) => {
            if (content !== widget.parentElement) {
              const buttonExpand = content.querySelector(selectors.expandButton);

              buttonExpand.classList.remove(classes.active);
              buttonExpand.nextElementSibling.classList.remove(classes.expanded);
            }
          });
        }
      });
    });
  }

  /**
   * Cart update event hook
   *
   * @return  {Void}
   */

  cartUpdateEvent(item) {
    item.addEventListener('theme:cart:update', (event) => {
      this.updateCart(
        {
          id: event.detail.id,
          quantity: event.detail.quantity,
        },
        item,
        event.detail.valueIsEmpty
      );
    });
  }

  /**
   *  Callback for add product to the cart
   */
  addToCartCallback(event) {
    if (!event.detail.data) return;

    const quickAddObject = event.detail;
    const button = event.detail.button;
    const formData = JSON.stringify({items: [event.detail.data]});

    this.addToCart(formData, quickAddObject, button);
  }

  /**
   * Cart events
   *
   * @return  {Void}
   */

  cartEvents() {
    const cartItemRemove = document.querySelectorAll(selectors.cartItemRemove);

    cartItemRemove.forEach((button) => {
      const item = button.closest(selectors.item);
      button.addEventListener('click', (event) => {
        event.preventDefault();

        if (button.classList.contains(classes.disabled)) return;

        this.updateCart(
          {
            id: button.dataset.id,
            quantity: 0,
          },
          item
        );
      });
    });

    if (this.cartCloseErrorMessage) {
      this.cartCloseErrorMessage.addEventListener('click', (event) => {
        event.preventDefault();

        this.cartErrorHolder.classList.remove(classes.expanded);
      });
    }
  }

  /**
   * Cart event add product to cart
   *
   * @return  {Void}
   */

  cartEventAdd() {
    document.addEventListener('click', (event) => {
      const clickedElement = event.target;

      if (clickedElement.matches(selectors.buttonAddToCart) || (clickedElement.closest(selectors.buttonAddToCart) && clickedElement)) {
        let formData = '';
        let button = clickedElement.matches(selectors.buttonAddToCart) ? clickedElement : clickedElement.closest(selectors.buttonAddToCart);

        if (button.hasAttribute('disabled')) return;

        if (button.hasAttribute(attributes.quickAddVariant)) {
          formData = JSON.stringify({
            items: [
              {
                id: Number(button.getAttribute(attributes.quickAddVariant)),
                quantity: 1,
              },
            ],
          });
        } else {
          this.form = clickedElement.closest('form');

          // Validate form
          if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
          }

          formData = new FormData(this.form);
        }

        if (this.form !== null && this.form.querySelector('[type="file"]')) {
          return;
        }

        event.preventDefault();

        this.addToCart(formData, null, button);

        document.dispatchEvent(
          new CustomEvent('theme:cart:add', {
            bubbles: true,
            detail: {
              selector: clickedElement,
            },
          })
        );
      }
    });
  }

  /**
   * Cart event remove out of stock error
   *
   * @return  {Void}
   */

  cartEventRemoveError() {
    document.addEventListener('click', (event) => {
      const clickedElement = event.target;

      if (clickedElement.matches(selectors.formCloseError) || clickedElement.closest(selectors.formCloseError)) {
        event.preventDefault();

        const errorContainer = clickedElement.closest(selectors.formErrorsContainer);

        if (errorContainer) {
          errorContainer.classList.remove(classes.visible);
        }
      }
    });
  }

  /**
   * Estimate shippint calculator
   *
   * @return  {Void}
   */

  estimateShippingCalculator() {
    Shopify.Cart.ShippingCalculator.show({
      submitButton: theme.strings.shippingCalcSubmitButton,
      submitButtonDisabled: theme.strings.shippingCalcSubmitButtonDisabled,
      customerIsLoggedIn: theme.settings.customerLoggedIn,
      moneyFormat: theme.moneyWithCurrencyFormat,
    });
  }

  /**
   * Get response from the cart
   *
   * @return  {Void}
   */

  getCart() {
    fetch(theme.routes.root + 'cart.js')
      .then(this.cartErrorsHandler)
      .then((response) => response.json())
      .then((response) => {
        this.newTotalItems = response.items.length;
        this.subtotal = response.total_price;
        this.itemCount = response.item_count;
        this.cartDiscounts = response.total_discount;

        this.buildTotalPrice(response);

        document.dispatchEvent(
          new CustomEvent('theme:cart:change', {
            bubbles: true,
            detail: {
              cart: response,
            },
          })
        );

        return fetch(theme.routes.cart + '?section_id=api-cart-items');
      })
      .then((response) => response.text())
      .then((response) => {
        const element = document.createElement('div');
        element.innerHTML = response;

        const cleanResponse = element.querySelector(selectors.apiContent);
        this.build(cleanResponse);
      })
      .catch((error) => console.log(error));
  }

  /**
   * Add item(s) to the cart and show the added item(s)
   *
   * @param   {String}  formData
   * @param   {DOM Element/Object}  quickAddHolder
   * @param   {DOM Element}  button
   *
   * @return  {Void}
   */

  addToCart(formData, quickAddObject = null, button = null) {
    if (this.cart) {
      this.cart.classList.add(classes.loading);
    }

    const quickAddHolder = quickAddObject ? quickAddObject.element : null;
    let buttonQuickAddMobile = null;

    if (this.cartDrawerEnabled) {
      if (button) {
        button.classList.add(classes.loading);
        button.disabled = true;
      }

      if (quickAddHolder) {
        quickAddHolder.classList.add(classes.visible);
        buttonQuickAddMobile = quickAddHolder.querySelector(selectors.buttonQuickAddMobile);
      }
    }

    let data = formData;
    let headers = {
      'Content-Type': 'application/json',
    };

    if (typeof formData !== 'string') {
      data = new URLSearchParams(formData).toString();
      headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }

    fetch(theme.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: headers,
      body: data,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.addToCartError(response, quickAddHolder, button);

          if (button) {
            button.classList.remove(classes.loading);
            button.disabled = false;
          }

          if (buttonQuickAddMobile) {
            buttonQuickAddMobile.classList.remove(classes.loading);
            buttonQuickAddMobile.disabled = false;
          }

          return;
        }

        if (this.cartDrawerEnabled) {
          if (button) {
            button.classList.remove(classes.hidden, classes.loading);
            button.classList.add(classes.added);

            button.dispatchEvent(
              new CustomEvent('theme:product:add', {
                detail: {
                  response: response,
                  button: button,
                },
                bubbles: true,
              })
            );
          }

          if (buttonQuickAddMobile) {
            buttonQuickAddMobile.classList.remove(classes.hidden, classes.loading);
            buttonQuickAddMobile.classList.add(classes.added);
          }

          this.getCart();
        } else {
          window.location = theme.routes.cart;
        }
      })
      .catch((error) => {
        this.addToCartError(error, quickAddHolder, button);
        this.enableCartButtons();
      });
  }

  /**
   * Update cart
   *
   * @param   {Object}  updateData
   *
   * @return  {Void}
   */

  updateCart(updateData = {}, currentItem = null, valueIsEmpty = false) {
    this.cart.classList.add(classes.loading);

    let newCount = null;
    let oldCount = null;
    let newItem = null;
    let updatedQuantity = updateData.quantity;
    if (currentItem !== null) {
      if (updatedQuantity) {
        currentItem.classList.add(classes.loading);
      } else {
        currentItem.classList.add(classes.removed);
      }
    }
    this.disableCartButtons();

    fetch(theme.routes.root + 'cart.js')
      .then(this.cartErrorsHandler)
      .then((response) => response.json())
      .then((response) => {
        const matchKeys = (item) => item.key === updateData.id;
        const index = response.items.findIndex(matchKeys);
        oldCount = response.item_count;
        newItem = response.items[index]?.title;

        const data = {
          line: `${index + 1}`,
          quantity: updatedQuantity,
        };

        return fetch(theme.routes.root + 'cart/change.js', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
      })
      .then(this.cartErrorsHandler)
      .then((response) => response.json())
      .then((response) => {
        newCount = response.item_count;

        if (valueIsEmpty) {
          updatedQuantity = 1;
        }

        if (updatedQuantity !== 0) {
          this.cartUpdateFailed = newCount === oldCount;
          this.updateErrorText(newItem);
        }

        this.getCart();
      })
      .catch((error) => {
        console.log(error);
        this.enableCartButtons();
      });
  }

  /**
   * Disable cart buttons and inputs
   *
   * @return  {Void}
   */
  disableCartButtons() {
    const inputs = this.cart.querySelectorAll('input');
    const buttons = this.cart.querySelectorAll(`button, ${selectors.cartItemRemove}`);

    if (inputs.length) {
      inputs.forEach((item) => {
        item.classList.add(classes.disabled);
        item.blur();
        item.disabled = true;
      });
    }

    if (buttons.length) {
      buttons.forEach((item) => {
        item.setAttribute(attributes.disabled, true);
      });
    }
  }

  /**
   * Enable cart buttons and inputs
   *
   * @return  {Void}
   */
  enableCartButtons() {
    const inputs = this.cart.querySelectorAll('input');
    const buttons = this.cart.querySelectorAll(`button, ${selectors.cartItemRemove}`);

    if (inputs.length) {
      inputs.forEach((item) => {
        item.classList.remove(classes.disabled);
        item.disabled = false;
      });
    }

    if (buttons.length) {
      buttons.forEach((item) => {
        item.removeAttribute(attributes.disabled);
      });
    }

    this.cart.classList.remove(classes.loading);
  }

  /**
   * Update error text
   *
   * @param   {String}  itemTitle
   *
   * @return  {Void}
   */

  updateErrorText(itemTitle) {
    this.cartErrorHolder.querySelector(selectors.errorMessage).innerText = itemTitle;
  }

  /**
   * Toggle error message
   *
   * @return  {Void}
   */

  toggleErrorMessage() {
    if (!this.cartErrorHolder) return;

    if (this.cartUpdateFailed) {
      this.cartErrorHolder.classList.add(classes.expanded);
    } else {
      this.cartErrorHolder.classList.remove(classes.expanded);
    }

    // Reset cart error events flag
    this.cartUpdateFailed = false;
  }

  /**
   * Handle errors
   *
   * @param   {Object}  response
   *
   * @return  {Object}
   */

  cartErrorsHandler(response) {
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

  /**
   * Add to cart error handle
   *
   * @param   {Object}  data
   * @param   {DOM Element/Null} quickAddHolder
   * @param   {DOM Element/Null} button
   *
   * @return  {Void}
   */

  addToCartError(data, quickAddHolder, button) {
    if (this.cartDrawerEnabled && button && button.closest(selectors.cartDrawer) !== null && !button.closest(selectors.cartDrawer)) {
      this.closeCartDrawer();
    }

    if (button !== null) {
      const outerContainer = button.closest(selectors.outerSection) || button.closest(selectors.quickAddHolder) || button.closest(selectors.quickAddModal);
      let errorContainer = outerContainer?.querySelector(selectors.formErrorsContainer);
      const buttonUpsellHolder = button.closest(selectors.quickAddHolder);

      if (buttonUpsellHolder && buttonUpsellHolder.querySelector(selectors.formErrorsContainer)) {
        errorContainer = buttonUpsellHolder.querySelector(selectors.formErrorsContainer);
      }

      if (errorContainer) {
        errorContainer.innerHTML = `<div class="errors">${data.message}: ${data.description}<span class="errors__close" data-close-error><svg aria-hidden="true" focusable="false" role="presentation" width="24px" height="24px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="icon icon-cancel"><path d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></div>`;
        errorContainer.classList.add(classes.visible);
      }

      button.dispatchEvent(
        new CustomEvent('theme:product:add-error', {
          detail: {
            response: data,
          },
          bubbles: true,
        })
      );
    }

    if (quickAddHolder) {
      quickAddHolder.dispatchEvent(
        new CustomEvent('theme:cart:error', {
          bubbles: true,
          detail: {
            message: data.message,
            description: data.description,
            holder: quickAddHolder,
          },
        })
      );
    }

    this.cart.classList.remove(classes.loading);
  }

  /**
   * Add product to cart events
   *
   * @return  {Void}
   */
  productAddCallback(event) {
    if (theme.settings.cartDrawerEnabled) {
      let buttons = [];
      let quickAddHolder = null;
      let buttonQuickAddMobile = null;
      const hasError = event.type == 'theme:product:add-error';
      const buttonATC = event.target;
      const cartBarButtonATC = document.querySelector(selectors.cartBarAdd);

      buttons.push(buttonATC);
      quickAddHolder = buttonATC.closest(selectors.quickAddHolder);

      if (quickAddHolder) {
        buttonQuickAddMobile = quickAddHolder.querySelector(selectors.buttonQuickAddMobile);
        if (buttonQuickAddMobile) {
          buttons.push(buttonQuickAddMobile);
        }
      }

      if (cartBarButtonATC) {
        buttons.push(cartBarButtonATC);
      }

      buttons.forEach((button) => {
        button.classList.remove(classes.loading);
        if (!hasError) {
          button.classList.add(classes.added);
        }
      });

      setTimeout(() => {
        buttons.forEach((button) => {
          button.classList.remove(classes.added);
          button.disabled = false;
        });

        if (quickAddHolder) {
          quickAddHolder.classList.remove(classes.visible);
        }
      }, settings.times.timeoutButtonReset);
    }
  }

  /**
   * Open cart drawer when product is added to cart
   *
   * @return  {Void}
   */
  openCartDrawerOnProductAdded() {
    if (this.cartDrawer && !this.cartDrawerIsOpen) {
      this.openCartDrawer();
    }
  }

  /**
   * Open cart drawer and add class on body
   *
   * @return  {Void}
   */

  openCartDrawer() {
    if (!this.cartDrawer) return;

    this.cartDrawerIsOpen = true;

    document.dispatchEvent(new CustomEvent('theme:cart:open', {bubbles: true}));
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawer}));
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawerBody}));

    this.cartDrawer.classList.add(classes.open);

    // Observe Additional Checkout Buttons
    this.observeAdditionalCheckoutButtons();

    // Animate cart items
    this.requestItemsAnimationFrame();

    this.accessibility.trapFocus(this.cartDrawer, {
      elementToFocus: this.cartDrawer.querySelector(selectors.cartToggleElement),
    });
  }

  /**
   * Close cart drawer and remove class on body
   *
   * @return  {Void}
   */

  closeCartDrawer() {
    if (!this.cartDrawer) return;
    if (!this.cartDrawer.classList.contains(classes.open)) return;

    this.cartDrawerIsOpen = false;

    document.dispatchEvent(
      new CustomEvent('theme:cart:close', {
        bubbles: true,
      })
    );

    // Cart elements animation reset
    this.resetAnimatedItems();
    this.itemsHolder.classList.remove(classes.updated);
    this.cartEmpty.classList.remove(classes.updated);
    this.cartErrorHolder.classList.remove(classes.expanded);
    this.cartDrawer.querySelectorAll(selectors.animation).forEach((item) => {
      const removeHidingClass = () => {
        item.classList.remove(classes.hiding);
        item.removeEventListener('animationend', removeHidingClass);
      };

      item.classList.add(classes.hiding);
      item.addEventListener('animationend', removeHidingClass);
    });
    this.cartDrawer.classList.remove(classes.open);
    this.accessibility.removeTrapFocus();

    if (this.body.classList.contains(classes.focused)) {
      const buttonOpenCart = this.headerWrapper.querySelectorAll(`${selectors.cartToggleElement}`);
      if (buttonOpenCart.length) {
        buttonOpenCart.forEach((button) => {
          if (isVisible(button)) {
            setTimeout(() => {
              button.focus();
            }, 200);

            return true;
          }
        });
      }
    }

    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }

  /**
   * Toggle cart drawer
   *
   * @return  {Void}
   */

  toggleCartDrawer() {
    if (!this.cartDrawerIsOpen) {
      this.openCartDrawer();
    } else {
      this.closeCartDrawer();
    }
  }

  /**
   * Event click to element to open cart drawer
   *
   * @return  {Void}
   */

  cartToggleEvents() {
    document.addEventListener('click', (event) => {
      const clickedElement = event.target;
      const isNotCartButton = !(clickedElement.matches(selectors.cartToggleElement) || clickedElement.closest(selectors.cartToggleElement));
      const isNotCartDrawerUnderlay = !(clickedElement.matches(selectors.drawerUnderlay) || clickedElement.closest(selectors.drawerUnderlay));
      const isNotCartDrawerOrCartDrawerChild = !(clickedElement.matches(selectors.cartDrawer) || clickedElement.closest(selectors.cartDrawer)) || !isNotCartDrawerUnderlay;
      const isNotPairProduct = !(clickedElement.matches(selectors.buttonSkipUpsellProduct) || clickedElement.closest(selectors.buttonSkipUpsellProduct));

      if (clickedElement.matches(selectors.cartToggleElement) || clickedElement.closest(selectors.cartToggleElement)) {
        event.preventDefault();

        this.toggleCartDrawer();
      } else if (this.cartDrawerIsOpen && isNotCartButton && isNotCartDrawerOrCartDrawerChild && isNotPairProduct) {
        this.closeCartDrawer();
      }
    });

    if (this.cartDrawer) {
      this.cartDrawer.addEventListener('keyup', (event) => {
        if (event.code === window.theme.keyboardKeys.ESCAPE) {
          this.closeCartDrawer();
        }
      });
    }
  }

  /**
   * Toggle classes on different containers and messages
   *
   * @return  {Void}
   */

  toggleClassesOnContainers() {
    const hasItemsInCart = this.hasItemsInCart();

    this.cartEmpty.classList.toggle(classes.hidden, hasItemsInCart);
    this.buttonHolder.classList.toggle(classes.hidden, !hasItemsInCart);
    this.itemsHolder.classList.toggle(classes.hidden, !hasItemsInCart);
  }

  /**
   * Build cart depends on results
   *
   * @param   {Object}  data
   *
   * @return  {Void}
   */

  build(data) {
    const cartItemsData = data.querySelector(selectors.apiLineItems);
    const upsellItemsData = data.querySelector(selectors.apiUpsellItems);
    const cartEmptyData = Boolean(cartItemsData === null && upsellItemsData === null);

    if (cartEmptyData) {
      this.itemsHolder.innerHTML = data;
      this.upsellProductsHolder.innerHTML = '';
    } else {
      this.itemsHolder.innerHTML = cartItemsData.innerHTML;
      this.upsellProductsHolder.innerHTML = upsellItemsData.innerHTML;
      this.skipUpsellProductEvent();
      this.checkSkippedUpsellProductsFromStorage();
      this.toggleCartUpsellWidgetVisibility();
    }

    // Update cart total price
    this.cartTotal.innerHTML = this.subtotal === 0 ? window.theme.strings.free : formatMoney(this.subtotal, theme.moneyWithCurrencyFormat);

    // Remove cart loading class
    this.cart.classList.remove(classes.loading);

    if (this.totalItems !== this.newTotalItems) {
      this.totalItems = this.newTotalItems;

      this.toggleClassesOnContainers();
    }

    // Add class "is-updated" line items holder to reduce cart items animation delay via CSS variables
    if (this.cartDrawerIsOpen) {
      this.itemsHolder.classList.add(classes.updated);
    }

    // Prepare empty cart buttons for animation
    if (!this.hasItemsInCart()) {
      this.cartEmpty.querySelectorAll(selectors.animation).forEach((item) => {
        item.classList.remove(classes.animated);
      });
    }

    this.freeShippingMessageHandle(this.subtotal);
    this.cartEvents();
    this.initQuantity();
    this.toggleErrorMessage();
    this.enableCartButtons();

    this.updateProgress();

    document.dispatchEvent(
      new CustomEvent('theme:cart:loaded', {
        bubbles: true,
      })
    );

    document.dispatchEvent(
      new CustomEvent('theme:product:added', {
        bubbles: true,
      })
    );
  }

  /**
   * Check for items in the cart
   *
   * @return  {Void}
   */

  hasItemsInCart() {
    return this.totalItems > 0;
  }

  /**
   * Build total cart total price
   *
   * @param   {Object}  data
   *
   * @return  {Void}
   */

  buildTotalPrice(data) {
    if (data.original_total_price > data.total_price && data.cart_level_discount_applications.length > 0) {
      this.cartOriginalTotal.classList.remove(classes.hidden);
      this.cartOriginaTotalPrice.innerHTML = data.original_total_price === 0 ? window.theme.strings.free : formatMoney(data.original_total_price, theme.moneyFormat);
    } else {
      this.cartOriginalTotal.classList.add(classes.hidden);
    }

    if (data.cart_level_discount_applications.length > 0) {
      const discountsMarkup = this.buildCartTotalDiscounts(data.cart_level_discount_applications);

      this.cartDiscountHolder.classList.remove(classes.hidden);
      this.cartDiscountHolder.innerHTML = discountsMarkup;
    } else {
      this.cartDiscountHolder.classList.add(classes.hidden);
    }
  }

  /**
   * Build cart total discounts
   *
   * @param   {Array}  discounts
   *
   * @return  {String}
   */

  buildCartTotalDiscounts(discounts) {
    let discountMarkup = '';

    discounts.forEach((discount) => {
      const discountTemplate = document.createElement('div');
      discountTemplate.innerHTML = this.cartTotalDiscountTemplate;
      discountTemplate.querySelector(selectors.cartTotalDiscountTitle).innerHTML = discount.title;
      discountTemplate.querySelector(selectors.cartTotalDiscountAmount).innerHTML = formatMoney(discount.total_allocated_amount, theme.moneyFormat);
      discountMarkup += discountTemplate.innerHTML;
    });

    return discountMarkup;
  }

  /**
   * Show/hide free shipping message
   *
   * @param   {Number}  total
   *
   * @return  {Void}
   */

  freeShippingMessageHandle(total) {
    if (!this.freeShipping.length) return;

    this.cartFreeShippingLimit = Number(this.freeShipping[0].getAttribute(attributes.freeShippingLimit)) * 100 * window.Shopify.currency.rate;

    this.freeShipping.forEach((message) => {
      const hasQualifiedShippingMessage = message.hasAttribute(attributes.freeShipping) && message.getAttribute(attributes.freeShipping) === 'true' && total >= 0;
      message.classList.toggle(classes.success, hasQualifiedShippingMessage && total >= this.cartFreeShippingLimit);
    });
  }

  /**
   * Update progress when update cart
   *
   * @return  {Void}
   */

  updateProgress() {
    this.freeShipping = document.querySelectorAll(selectors.freeShipping);

    if (!this.freeShipping.length) return;

    const percentValue = isNaN(this.subtotal / this.cartFreeShippingLimit) ? 100 : this.subtotal / this.cartFreeShippingLimit;
    const percent = Math.min(percentValue * 100, 100);
    const dashoffset = this.circumference - ((percent / 100) * this.circumference) / 2;
    const leftToSpend = formatMoney(this.cartFreeShippingLimit - this.subtotal, theme.moneyFormat);

    this.freeShipping.forEach((item) => {
      const progressBar = item.querySelector(selectors.freeShippingProgress);
      const progressGraph = item.querySelector(selectors.freeShippingGraph);
      const leftToSpendMessage = item.querySelector(selectors.leftToSpend);

      if (leftToSpendMessage) {
        leftToSpendMessage.innerHTML = leftToSpend.replace('.00', '').replace(',00', '');
      }

      // Set progress bar value
      if (progressBar) {
        progressBar.value = percent;
      }

      // Set circle progress
      if (progressGraph) {
        progressGraph.style.setProperty('--stroke-dashoffset', `${dashoffset}`);
      }
    });
  }

  /**
   * Skip upsell product
   */
  skipUpsellProductEvent() {
    if (this.upsellProductsHolder === null) {
      return;
    }
    const skipButtons = this.upsellProductsHolder.querySelectorAll(selectors.buttonSkipUpsellProduct);

    if (skipButtons.length) {
      skipButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const productID = button.closest(selectors.quickAddHolder).getAttribute(attributes.quickAddHolder);

          if (!this.skipUpsellProductsArray.includes(productID)) {
            this.skipUpsellProductsArray.push(productID);
          }

          // Add skipped upsell product to session storage
          window.sessionStorage.setItem('skip_upsell_products', this.skipUpsellProductsArray);

          // Remove upsell product from cart
          this.removeUpsellProduct(productID);
          this.toggleCartUpsellWidgetVisibility();
        });
      });
    }
  }

  /**
   * Check for skipped upsell product added to session storage
   */
  checkSkippedUpsellProductsFromStorage() {
    const skippedUpsellItemsFromStorage = window.sessionStorage.getItem('skip_upsell_products');
    if (!skippedUpsellItemsFromStorage) return;

    const skippedUpsellItemsFromStorageArray = skippedUpsellItemsFromStorage.split(',');

    skippedUpsellItemsFromStorageArray.forEach((productID) => {
      if (!this.skipUpsellProductsArray.includes(productID)) {
        this.skipUpsellProductsArray.push(productID);
      }

      this.removeUpsellProduct(productID);
    });
  }

  removeUpsellProduct(productID) {
    if (!this.upsellProductsHolder) return;

    // Remove skipped upsell product from Cart
    const upsellProduct = this.upsellProductsHolder.querySelector(`[${attributes.quickAddHolder}="${productID}"]`);

    if (upsellProduct) {
      upsellProduct.parentNode.remove();
    }
  }

  /**
   * Show or hide cart upsell products widget visibility
   */
  toggleCartUpsellWidgetVisibility() {
    if (!this.upsellProductsHolder) return;

    // Hide upsell container if no items
    const upsellItems = this.upsellProductsHolder.querySelectorAll(selectors.quickAddHolder);
    const cartWidget = this.upsellProductsHolder.closest(selectors.cartWidget);

    if (!cartWidget) return;

    const cartWidgetToggleButton = cartWidget.querySelector(selectors.expandButton);
    const cartWidgetContent = cartWidget.querySelector(selectors.cartWidgetContent);

    cartWidget.classList.toggle(classes.hidden, !upsellItems.length);

    if (this.cartDrawer && this.cartDrawerIsOpen) {
      cartWidget.classList.toggle(classes.animated, upsellItems.length);
    }

    if (cartWidgetToggleButton) {
      cartWidgetToggleButton.classList.toggle(classes.active, upsellItems.length);
    }

    if (cartWidgetContent) {
      cartWidgetContent.classList.toggle(classes.expanded, upsellItems.length);
    }
  }

  observeAdditionalCheckoutButtons() {
    // identify an element to observe
    const additionalCheckoutButtons = this.cartDrawer.querySelector(selectors.additionalCheckoutButtons);
    if (additionalCheckoutButtons) {
      // create a new instance of `MutationObserver` named `observer`,
      // passing it a callback function
      const observer = new MutationObserver(() => {
        this.accessibility.trapFocus(this.cartDrawer, {
          elementToFocus: this.cartDrawer.querySelector(selectors.cartToggleElement),
        });
        observer.disconnect();
      });

      // call `observe()` on that MutationObserver instance,
      // passing it the element to observe, and the options object
      observer.observe(additionalCheckoutButtons, {subtree: true, childList: true});
    }
  }

  /**
   * Remove initially added AOS classes to allow animation on cart drawer open
   *
   * @return  {Void}
   */
  resetAnimatedItems() {
    this.cart.querySelectorAll(selectors.animation).forEach((item) => {
      item.classList.remove(classes.animated);
      item.classList.remove(classes.hiding);
    });
  }

  requestItemsAnimationFrame() {
    requestAnimationFrame(this.animateItems);
  }

  /**
   * Cart elements opening animation
   *
   * @return  {Void}
   */
  animateItems() {
    this.cart.querySelectorAll(selectors.animation).forEach((item) => {
      item.classList.add(classes.animated);
    });
  }
}

window.cart = new CartDrawer();
