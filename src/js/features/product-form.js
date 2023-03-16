import {formatMoney} from '@shopify/theme-currency';
import FlickityFade from 'flickity-fade';

import QuantityCounter from '../globals/quantity-handle';
import hideElement from '../util/hide-element';
import showElement from '../util/show-element';
import scrollTo from '../util/scroll-to';
import {ProductForm} from '../vendor/theme-scripts/theme-product-form';
import {isDesktop} from '../util/media-query';

import SelloutVariants from './product-form-sellout';

const selectors = {
  product: '[data-product]',
  productForm: '[data-product-form]',
  addToCart: '[data-add-to-cart]',
  addToCartText: '[data-add-to-cart-text]',
  comparePrice: '[data-compare-price]',
  comparePriceText: '[data-compare-text]',
  formWrapper: '[data-form-wrapper]',
  originalSelectorId: '[data-product-select]',
  priceWrapper: '[data-price-wrapper]',
  productSlideshow: '[data-product-slideshow]',
  productImage: '[data-product-image]',
  productJson: '[data-product-json]',
  productPrice: '[data-product-price]',
  unitPrice: '[data-product-unit-price]',
  unitBase: '[data-product-base]',
  unitWrapper: '[data-product-unit]',
  isPreOrder: '[data-product-preorder]',
  sliderEnabled: 'flickity-enabled',
  productSlide: '.product__slide',
  subPrices: '[data-subscription-watch-price]',
  subSelectors: '[data-subscription-selectors]',
  subsToggle: '[data-toggles-group]',
  subsChild: 'data-group-toggle',
  subDescription: '[data-plan-description]',
  priceOffWrap: '[data-price-off]',
  priceOffType: '[data-price-off-type]',
  priceOffAmount: '[data-price-off-amount]',
  remainingCount: '[data-remaining-count]',
  remainingMax: '[data-remaining-max]',
  remainingWrapper: '[data-remaining-wrapper]',
  remainingJSON: '[data-product-remaining-json]',
  optionValue: '[data-option-value]',
  optionPosition: '[data-option-position]',
  installment: 'product-form-installment',
  inputId: 'input[name="id"]',
};

const classes = {
  hidden: 'hidden',
  variantSoldOut: 'variant--soldout',
  variantUnavailable: 'variant--unavailable',
  productPriceSale: 'product__price--sale',
  remainingLow: 'count-is-low',
  remainingIn: 'count-is-in',
  remainingOut: 'count-is-out',
  remainingUnavailable: 'count-is-unavailable',
};

const attributes = {
  dataTallLayout: 'data-tall-layout',
  remainingMaxAttr: 'data-remaining-max',
  dataEnableHistoryState: 'data-enable-history-state',
  optionPosition: 'data-option-position',
  dataImageId: 'data-image-id',
};

class ProductAddForm {
  constructor(section, modalHolder = null) {
    this.section = section;
    this.sectionId = section?.id || modalHolder?.id;
    this.container = modalHolder || section.container;
    this.tallLayout = this.container.getAttribute(attributes.dataTallLayout) === 'true';
    this.product = this.container.querySelector(selectors.product);
    this.productForm = this.container.querySelector(selectors.productForm);
    this.installmentForm = this.container.querySelector(`#${selectors.installment}-${this.sectionId}`);
    this.sellout = null;

    this.priceOffWrap = this.container.querySelector(selectors.priceOffWrap);
    this.priceOffAmount = this.container.querySelector(selectors.priceOffAmount);
    this.priceOffType = this.container.querySelector(selectors.priceOffType);
    this.planDescription = this.container.querySelector(selectors.subDescription);

    this.remainingWrapper = this.container.querySelector(selectors.remainingWrapper);

    if (this.remainingWrapper) {
      const remainingMaxWrap = this.container.querySelector(selectors.remainingMax);
      if (remainingMaxWrap) {
        this.remainingMaxInt = parseInt(remainingMaxWrap.getAttribute(attributes.remainingMaxAttr), 10);
        this.remainingCount = this.container.querySelector(selectors.remainingCount);
        this.remainingJSONWrapper = this.container.querySelector(selectors.remainingJSON);
        this.remainingJSON = null;

        if (this.remainingJSONWrapper && this.remainingJSONWrapper.innerHTML !== '') {
          this.remainingJSON = JSON.parse(this.remainingJSONWrapper.innerHTML);
        } else {
          console.warn('Missing product quantity JSON');
        }
      }
    }

    this.enableHistoryState = this.container.getAttribute(attributes.dataEnableHistoryState) === 'true';
    this.hasUnitPricing = this.container.querySelector(selectors.unitWrapper);
    this.subSelectors = this.container.querySelector(selectors.subSelectors);
    this.subPrices = this.container.querySelector(selectors.subPrices);
    this.isPreOrder = this.container.querySelector(selectors.isPreOrder);

    const counter = new QuantityCounter(this.container);
    counter.init();

    this.init();
  }

  init() {
    let productJSON = null;
    const productElemJSON = this.container.querySelector(selectors.productJson);
    if (productElemJSON) {
      productJSON = productElemJSON.innerHTML;
    }
    if (productJSON) {
      this.productJSON = JSON.parse(productJSON);
      this.linkForm();
      this.sellout = new SelloutVariants(this.container, this.productJSON);
    } else {
      console.error('Missing product JSON');
    }
  }

  destroy() {
    this.productForm.destroy();
  }

  linkForm() {
    this.productForm = new ProductForm(this.container, this.productJSON, {
      onOptionChange: this.onOptionChange.bind(this),
      onPlanChange: this.onPlanChange.bind(this),
    });
    this.pushState(this.productForm.getFormState());
    this.subsToggleListeners();
  }

  onOptionChange(evt) {
    this.pushState(evt.dataset);
    this.updateProductImage(evt);
  }

  onPlanChange(evt) {
    if (this.subPrices) {
      this.pushState(evt.dataset);
    }
  }

  pushState(formState) {
    this.productState = this.setProductState(formState);
    this.updateAddToCartState(formState);
    this.updateProductPrices(formState);
    this.updateSaleText(formState);
    this.updateSubscriptionText(formState);
    this.updateRemaining(formState);
    this.updateLegend(formState);
    this.fireHookEvent(formState);
    this.sellout?.update(formState);
    if (this.enableHistoryState) {
      this.updateHistoryState(formState);
    }
  }

  updateAddToCartState(formState) {
    const variant = formState.variant;
    let addText = theme.strings.addToCart;
    const priceWrapper = this.container.querySelectorAll(selectors.priceWrapper);
    const addToCart = this.container.querySelectorAll(selectors.addToCart);
    const addToCartText = this.container.querySelectorAll(selectors.addToCartText);
    const formWrapper = this.container.querySelectorAll(selectors.formWrapper);

    if (this.installmentForm && variant) {
      const installmentInput = this.installmentForm.querySelector(selectors.inputId);
      installmentInput.value = variant.id;
      installmentInput.dispatchEvent(new Event('change', {bubbles: true}));
    }

    if (this.isPreOrder) {
      addText = theme.strings.preOrder;
    }

    if (priceWrapper.length && variant) {
      priceWrapper.forEach((element) => {
        element.classList.remove(classes.hidden);
      });
    }

    if (addToCart.length) {
      addToCart.forEach((element) => {
        if (variant) {
          if (variant.available) {
            element.disabled = false;
          } else {
            element.disabled = true;
          }
        } else {
          element.disabled = true;
        }
      });
    }

    if (addToCartText.length) {
      addToCartText.forEach((element) => {
        if (variant) {
          if (variant.available) {
            element.innerHTML = addText;
          } else {
            element.innerHTML = theme.strings.soldOut;
          }
        } else {
          element.innerHTML = theme.strings.unavailable;
        }
      });
    }

    if (formWrapper.length) {
      formWrapper.forEach((element) => {
        if (variant) {
          if (variant.available) {
            element.classList.remove(classes.variantSoldOut, classes.variantUnavailable);
          } else {
            element.classList.add(classes.variantSoldOut);
            element.classList.remove(classes.variantUnavailable);
          }
          const formSelect = element.querySelector(selectors.originalSelectorId);
          if (formSelect) {
            formSelect.value = variant.id;
          }
        } else {
          element.classList.add(classes.variantUnavailable);
          element.classList.remove(classes.variantSoldOut);
        }
      });
    }
  }

  updateHistoryState(formState) {
    const variant = formState.variant;
    const plan = formState.plan;
    const location = window.location.href;
    if (variant && location.includes('/product')) {
      const url = new window.URL(location);
      const params = url.searchParams;
      params.set('variant', variant.id);
      if (plan && plan.detail && plan.detail.id && this.productState.hasPlan) {
        params.set('selling_plan', plan.detail.id);
      } else {
        params.delete('selling_plan');
      }
      url.search = params.toString();
      const urlString = url.toString();
      window.history.replaceState({path: urlString}, '', urlString);
    }
  }

  updateRemaining(formState) {
    const variant = formState.variant;

    this.remainingWrapper?.classList.remove(classes.remainingIn, classes.remainingOut, classes.remainingUnavailable, classes.remainingLow);

    if (variant && this.remainingWrapper && this.remainingJSON) {
      const remaining = this.remainingJSON[variant.id];

      if (remaining === 'out' || remaining < 1) {
        this.remainingWrapper.classList.add(classes.remainingOut);
      }

      if (remaining === 'in' || remaining >= this.remainingMaxInt) {
        this.remainingWrapper.classList.add(classes.remainingIn);
      }
      if (remaining === 'low' || (remaining > 0 && remaining < this.remainingMaxInt)) {
        this.remainingWrapper.classList.add(classes.remainingLow);

        if (this.remainingCount) {
          this.remainingCount.innerHTML = remaining;
        }
      }
    } else if (!variant && this.remainingWrapper) {
      this.remainingWrapper.classList.add(classes.remainingUnavailable);
    }
  }

  getBaseUnit(variant) {
    return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
  }

  subsToggleListeners() {
    const toggles = this.container.querySelectorAll(selectors.subsToggle);

    toggles.forEach((toggle) => {
      toggle.addEventListener(
        'change',
        function (e) {
          const val = e.target.value.toString();
          const selected = this.container.querySelector(`[${selectors.subsChild}="${val}"]`);
          const groups = this.container.querySelectorAll(`[${selectors.subsChild}]`);
          if (selected) {
            selected.classList.remove(classes.hidden);
            const first = selected.querySelector(`[name="selling_plan"]`);
            first.checked = true;
            first.dispatchEvent(new Event('change'));
          }
          groups.forEach((group) => {
            if (group !== selected) {
              group.classList.add(classes.hidden);
              const plans = group.querySelectorAll(`[name="selling_plan"]`);
              plans.forEach((plan) => {
                plan.checked = false;
                plan.dispatchEvent(new Event('change'));
              });
            }
          });
        }.bind(this)
      );
    });
  }

  updateSaleText(formState) {
    if (this.productState.planSale) {
      this.updateSaleTextSubscription(formState);
    } else if (this.productState.onSale) {
      this.updateSaleTextStandard(formState);
    } else if (this.priceOffWrap) {
      this.priceOffWrap.classList.add(classes.hidden);
    }
  }

  updateSaleTextStandard(formState) {
    if (this.priceOffType) {
      this.priceOffType.innerHTML = window.theme.strings.sale || 'sale';
    }

    if (this.priceOffAmount && this.priceOffWrap) {
      const variant = formState.variant;
      const discountFloat = (variant.compare_at_price - variant.price) / variant.compare_at_price;
      const discountInt = Math.floor(discountFloat * 100);
      this.priceOffAmount.innerHTML = `${discountInt}%`;
      this.priceOffWrap.classList.remove(classes.hidden);
    }
  }

  updateSubscriptionText(formState) {
    if (formState.plan && this.planDescription) {
      this.planDescription.innerHTML = formState.plan.detail.description;
      this.planDescription.classList.remove(classes.hidden);
    } else if (this.planDescription) {
      this.planDescription.classList.add(classes.hidden);
    }
  }

  updateSaleTextSubscription(formState) {
    if (this.priceOffType) {
      this.priceOffType.innerHTML = window.theme.strings.subscription || 'subscripton';
    }

    if (this.priceOffAmount && this.priceOffWrap) {
      const adjustment = formState.plan.detail.price_adjustments[0];
      const discount = adjustment.value;
      if (adjustment && adjustment.value_type === 'percentage') {
        this.priceOffAmount.innerHTML = `${discount}%`;
      } else {
        this.priceOffAmount.innerHTML = formatMoney(discount, theme.moneyFormat);
      }
      this.priceOffWrap.classList.remove(classes.hidden);
    }
  }

  updateProductPrices(formState) {
    const variant = formState.variant;
    const plan = formState.plan;
    const priceWrappers = this.container.querySelectorAll(selectors.priceWrapper);

    priceWrappers.forEach((wrap) => {
      const comparePriceEl = wrap.querySelector(selectors.comparePrice);
      const productPriceEl = wrap.querySelector(selectors.productPrice);
      const comparePriceText = wrap.querySelector(selectors.comparePriceText);

      let comparePrice = '';
      let price = '';

      if (this.productState.available) {
        comparePrice = variant.compare_at_price;
        price = variant.price;
      }

      if (this.productState.hasPlan) {
        price = plan.allocation.price;
      }

      if (this.productState.planSale) {
        comparePrice = plan.allocation.compare_at_price;
        price = plan.allocation.price;
      }

      if (comparePriceEl) {
        if (this.productState.onSale || this.productState.planSale) {
          comparePriceEl.classList.remove(classes.hidden);
          comparePriceText.classList.remove(classes.hidden);
          productPriceEl.classList.add(classes.productPriceSale);
        } else {
          comparePriceEl.classList.add(classes.hidden);
          comparePriceText.classList.add(classes.hidden);
          productPriceEl.classList.remove(classes.productPriceSale);
        }
        comparePriceEl.innerHTML = formatMoney(comparePrice, theme.moneyFormat);
      }

      productPriceEl.innerHTML = price === 0 ? window.theme.strings.free : formatMoney(price, theme.moneyFormat);
    });

    if (this.hasUnitPricing) {
      this.updateProductUnits(formState);
    }
  }

  updateProductUnits(formState) {
    const variant = formState.variant;
    const plan = formState.plan;
    let unitPrice = null;

    if (variant && variant.unit_price) {
      unitPrice = variant.unit_price;
    }
    if (plan && plan.allocation && plan.allocation.unit_price) {
      unitPrice = plan.allocation.unit_price;
    }

    if (unitPrice) {
      const base = this.getBaseUnit(variant);
      const formattedPrice = formatMoney(unitPrice, theme.moneyFormat);
      this.container.querySelector(selectors.unitPrice).innerHTML = formattedPrice;
      this.container.querySelector(selectors.unitBase).innerHTML = base;
      showElement(this.container.querySelector(selectors.unitWrapper));
    } else {
      hideElement(this.container.querySelector(selectors.unitWrapper));
    }
  }

  fireHookEvent(formState) {
    const variant = formState.variant;
    this.container.dispatchEvent(
      new CustomEvent('theme:variant:change', {
        detail: {
          variant: variant,
        },
        bubbles: true,
      })
    );
  }

  /**
   * Tracks aspects of the product state that are relevant to UI updates
   * @param {object} evt - variant change event
   * @return {object} productState - represents state of variant + plans
   *  productState.available - current variant and selling plan options result in valid offer
   *  productState.soldOut - variant is sold out
   *  productState.onSale - variant is on sale
   *  productState.showUnitPrice - variant has unit price
   *  productState.requiresPlan - all the product variants requires a selling plan
   *  productState.hasPlan - there is a valid selling plan
   *  productState.planSale - plan has a discount to show next to price
   *  productState.planPerDelivery - plan price does not equal per_delivery_price - a prepaid subscription
   */
  setProductState(dataset) {
    const variant = dataset.variant;
    const plan = dataset.plan;

    const productState = {
      available: true,
      soldOut: false,
      onSale: false,
      showUnitPrice: false,
      requiresPlan: false,
      hasPlan: false,
      planPerDelivery: false,
      planSale: false,
    };

    if (!variant || (variant.requires_selling_plan && !plan)) {
      productState.available = false;
    } else {
      if (!variant.available) {
        productState.soldOut = true;
      }

      if (variant.compare_at_price > variant.price) {
        productState.onSale = true;
      }

      if (variant.unit_price) {
        productState.showUnitPrice = true;
      }

      if (this.product && this.product.requires_selling_plan) {
        productState.requiresPlan = true;
      }

      if (plan && this.subPrices) {
        productState.hasPlan = true;
        if (plan.allocation.per_delivery_price !== plan.allocation.price) {
          productState.planPerDelivery = true;
        }
        if (variant.price > plan.allocation.price) {
          productState.planSale = true;
        }
      }
    }
    return productState;
  }

  updateProductImage(evt) {
    const variant = evt.dataset.variant;

    if (variant) {
      // Update variant image, if one is set
      if (variant.featured_media) {
        const newImg = this.container.querySelector(`[${attributes.dataImageId}="${variant.featured_media.id}"]`);
        const newImageParent = newImg?.closest(selectors.productSlide);
        // If we have a mobile breakpoint or the tall layout is disabled,
        // just switch the slideshow.

        if (newImageParent) {
          const newImagePos = Array.from(newImageParent.parentElement.children).indexOf(newImageParent);
          const slider = this.container.querySelector(selectors.productSlideshow);
          const isDesktopView = isDesktop();

          if (slider && slider.classList.contains(selectors.sliderEnabled)) {
            FlickityFade.data(slider).select(newImagePos);
          } else if (slider && !isDesktopView) {
            slider.scrollTo({
              top: 0,
              left: newImageParent.offsetLeft,
              behavior: 'smooth',
            });
          }

          if (isDesktopView && this.tallLayout) {
            // We know its a tall layout, if it's sticky
            // scroll to the images
            // Scroll to/reorder image unless it's the first photo on load
            const newImgTop = newImg.getBoundingClientRect().top;

            if (newImagePos === 0 && newImgTop + window.scrollY > window.pageYOffset) return;

            // Scroll to variant image
            document.dispatchEvent(
              new CustomEvent('theme:tooltip:close', {
                bubbles: false,
                detail: {
                  hideTransition: false,
                },
              })
            );

            scrollTo(newImgTop);
          }
        }
      }
    }
  }

  updateLegend(formState) {
    const variant = formState.variant;
    if (variant) {
      const optionValues = this.container.querySelectorAll(selectors.optionValue);
      if (optionValues.length) {
        optionValues.forEach((optionValue) => {
          const selectorWrapper = optionValue.closest(selectors.optionPosition);
          if (selectorWrapper) {
            const optionPosition = selectorWrapper.getAttribute(attributes.optionPosition);
            const optionIndex = parseInt(optionPosition, 10) - 1;
            const selectedOptionValue = variant.options[optionIndex];
            optionValue.innerHTML = selectedOptionValue;
          }
        });
      }
    }
  }
}

const productFormSection = {
  onLoad() {
    this.section = new ProductAddForm(this);
  },
};

export {ProductAddForm, productFormSection};
