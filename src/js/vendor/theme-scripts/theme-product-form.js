import Listeners from './listeners';
import {getVariantFromSerializedArray} from './theme-product';

var selectors = {
  idInput: '[name="id"]',
  planInput: '[name="selling_plan"]',
  optionInput: '[name^="options"]',
  quantityInput: '[name="quantity"]',
  propertyInput: '[name^="properties"]',
};

// Public Methods
// -----------------------------------------------------------------------------

/**
 * Returns a URL with a variant ID query parameter. Useful for updating window.history
 * with a new URL based on the currently select product variant.
 * @param {string} url - The URL you wish to append the variant ID to
 * @param {number} id  - The variant ID you wish to append to the URL
 * @returns {string} - The new url which includes the variant ID query parameter
 */

function getUrlWithVariant(url, id) {
  if (/variant=/.test(url)) {
    return url.replace(/(variant=)[^&]+/, '$1' + id);
  } else if (/\?/.test(url)) {
    return url.concat('&variant=').concat(id);
  }

  return url.concat('?variant=').concat(id);
}

/**
 * Constructor class that creates a new instance of a product form controller.
 *
 * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
 * @param {Object} product - A product object
 * @param {Object} options - Optional options object
 * @param {Function} options.onOptionChange - Callback for whenever an option input changes
 * @param {Function} options.onPlanChange - Callback for changes to name=selling_plan
 * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
 * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
 * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
 */
class ProductForm {
  constructor(element, product, options) {
    this.element = element;
    this.product = this._validateProductObject(product);
    this.variantElement = this.element.querySelector(selectors.idInput);

    options = options || {};

    this._listeners = new Listeners();
    this._listeners.add(this.element, 'submit', this._onSubmit.bind(this, options));

    this.optionInputs = this._initInputs(selectors.optionInput, options.onOptionChange);

    this.planInputs = this._initInputs(selectors.planInput, options.onPlanChange);

    this.quantityInputs = this._initInputs(selectors.quantityInput, options.onQuantityChange);

    this.propertyInputs = this._initInputs(selectors.propertyInput, options.onPropertyChange);
  }

  /**
   * Cleans up all event handlers that were assigned when the Product Form was constructed.
   * Useful for use when a section needs to be reloaded in the theme editor.
   */
  destroy() {
    this._listeners.removeAll();
  }

  /**
   * Getter method which returns the array of currently selected option values
   *
   * @returns {Array} An array of option values
   */
  options() {
    return this._serializeInputValues(this.optionInputs, function (item) {
      var regex = /(?:^(options\[))(.*?)(?:\])/;
      item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
      return item;
    });
  }

  /**
   * Getter method which returns the currently selected variant, or `null` if variant
   * doesn't exist.
   *
   * @returns {Object|null} Variant object
   */
  variant() {
    const opts = this.options();
    if (opts.length) {
      return getVariantFromSerializedArray(this.product, opts);
    } else {
      return this.product.variants[0];
    }
  }

  /**
   * Getter method which returns the current selling plan, or `null` if plan
   * doesn't exist.
   *
   * @returns {Object|null} Variant object
   */
  plan(variant) {
    let plan = {
      allocation: null,
      group: null,
      detail: null,
    };
    const sellingPlanChecked = this.element.querySelector(`${selectors.planInput}:checked`);
    if (!sellingPlanChecked) return null;
    const sellingPlanCheckedValue = sellingPlanChecked.value;
    const id = sellingPlanCheckedValue && sellingPlanCheckedValue !== '' ? sellingPlanCheckedValue : null;

    if (id && variant) {
      plan.allocation = variant.selling_plan_allocations.find(function (item) {
        return item.selling_plan_id.toString() === id.toString();
      });
    }
    if (plan.allocation) {
      plan.group = this.product.selling_plan_groups.find(function (item) {
        return item.id.toString() === plan.allocation.selling_plan_group_id.toString();
      });
    }
    if (plan.group) {
      plan.detail = plan.group.selling_plans.find(function (item) {
        return item.id.toString() === id.toString();
      });
    }

    if (plan && plan.allocation && plan.detail && plan.allocation) {
      return plan;
    } else return null;
  }

  /**
   * Getter method which returns a collection of objects containing name and values
   * of property inputs
   *
   * @returns {Array} Collection of objects with name and value keys
   */
  properties() {
    return this._serializeInputValues(this.propertyInputs, function (item) {
      var regex = /(?:^(properties\[))(.*?)(?:\])/;
      item.name = regex.exec(item.name)[2]; // Use just the value between 'properties[' and ']'
      return item;
    });
  }

  /**
   * Getter method which returns the current quantity or 1 if no quantity input is
   * included in the form
   *
   * @returns {Array} Collection of objects with name and value keys
   */
  quantity() {
    return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
  }

  getFormState() {
    const variant = this.variant();
    return {
      options: this.options(),
      variant: variant,
      properties: this.properties(),
      quantity: this.quantity(),
      plan: this.plan(variant),
    };
  }

  // Private Methods
  // -----------------------------------------------------------------------------
  _setIdInputValue(variant) {
    if (variant && variant.id) {
      this.variantElement.value = variant.id.toString();
    } else {
      this.variantElement.value = '';
    }

    this.variantElement.dispatchEvent(new Event('change'));
  }

  _onSubmit(options, event) {
    event.dataset = this.getFormState();
    if (options.onFormSubmit) {
      options.onFormSubmit(event);
    }
  }

  _onOptionChange(event) {
    this._setIdInputValue(event.dataset.variant);
  }

  _onFormEvent(cb) {
    if (typeof cb === 'undefined') {
      return Function.prototype.bind();
    }

    return function (event) {
      event.dataset = this.getFormState();
      this._setIdInputValue(event.dataset.variant);
      cb(event);
    }.bind(this);
  }

  _initInputs(selector, cb) {
    var elements = Array.prototype.slice.call(this.element.querySelectorAll(selector));

    return elements.map(
      function (element) {
        this._listeners.add(element, 'change', this._onFormEvent(cb));
        return element;
      }.bind(this)
    );
  }

  _serializeInputValues(inputs, transform) {
    return inputs.reduce(function (options, input) {
      if (
        input.checked || // If input is a checked (means type radio or checkbox)
        (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
      ) {
        options.push(transform({name: input.name, value: input.value}));
      }

      return options;
    }, []);
  }

  _validateProductObject(product) {
    if (typeof product !== 'object') {
      throw new TypeError(product + ' is not an object.');
    }

    if (typeof product.variants[0].options === 'undefined') {
      throw new TypeError('Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route');
    }
    return product;
  }
}

export {getUrlWithVariant, ProductForm};
