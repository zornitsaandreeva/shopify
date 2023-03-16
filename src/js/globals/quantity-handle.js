const selectors = {
  quantityHolder: '[data-quantity-holder]',
  quantityField: '[data-quantity-field]',
  quantityButton: '[data-quantity-button]',
  quantityMinusButton: '[data-quantity-minus]',
  quantityPlusButton: '[data-quantity-plus]',
  quantityReadOnly: 'read-only',
  isDisabled: 'is-disabled',
};

class QuantityCounter {
  constructor(holder, inCart = false) {
    this.holder = holder;
    this.quantityUpdateCart = inCart;
  }

  init() {
    // Settings
    this.settings = selectors;

    // DOM Elements
    this.quantity = this.holder.querySelector(this.settings.quantityHolder);

    if (!this.quantity) {
      return;
    }

    this.field = this.quantity.querySelector(this.settings.quantityField);
    this.buttons = this.quantity.querySelectorAll(this.settings.quantityButton);
    this.increaseButton = this.quantity.querySelector(this.settings.quantityPlusButton);

    // Set value or classes
    this.quantityValue = Number(this.field.value || 0);
    this.cartItemID = this.field.getAttribute('data-id');
    this.maxValue = Number(this.field.getAttribute('max')) > 0 ? Number(this.field.getAttribute('max')) : null;
    this.minValue = Number(this.field.getAttribute('min')) > 0 ? Number(this.field.getAttribute('min')) : 0;
    this.disableIncrease = this.disableIncrease.bind(this);

    // Flags
    this.emptyField = false;

    // Methods
    this.updateQuantity = this.updateQuantity.bind(this);
    this.decrease = this.decrease.bind(this);
    this.increase = this.increase.bind(this);

    this.disableIncrease();

    // Events
    if (!this.quantity.classList.contains(this.settings.quantityReadOnly)) {
      this.changeValueOnClick();
      this.changeValueOnInput();
    }
  }

  /**
   * Change field value when click on quantity buttons
   *
   * @return  {Void}
   */

  changeValueOnClick() {
    const that = this;

    this.buttons.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const clickedElement = event.target;
        const isDescrease = clickedElement.matches(that.settings.quantityMinusButton) || clickedElement.closest(that.settings.quantityMinusButton);
        const isIncrease = clickedElement.matches(that.settings.quantityPlusButton) || clickedElement.closest(that.settings.quantityPlusButton);

        if (isDescrease) {
          that.decrease();
        }

        if (isIncrease) {
          that.increase();
        }

        that.updateQuantity();
      });
    });
  }

  /**
   * Change field value when input new value in a field
   *
   * @return  {Void}
   */

  changeValueOnInput() {
    this.field.addEventListener('change', () => {
      this.quantityValue = this.field.value;

      if (this.field.value === '') {
        this.emptyField = true;
      }

      this.updateQuantity();
    });
  }

  /**
   * Update field value
   *
   * @return  {Void}
   */

  updateQuantity() {
    if (this.maxValue < this.quantityValue && this.maxValue !== null) {
      this.quantityValue = this.maxValue;
    }

    if (this.minValue > this.quantityValue) {
      this.quantityValue = this.minValue;
    }

    this.field.value = this.quantityValue;

    this.disableIncrease();

    if (this.quantityUpdateCart) {
      this.updateCart();
    }
  }

  /**
   * Decrease value
   *
   * @return  {Void}
   */

  decrease() {
    if (this.quantityValue > this.minValue) {
      this.quantityValue--;

      return;
    }

    this.quantityValue = 0;
  }

  /**
   * Increase value
   *
   * @return  {Void}
   */

  increase() {
    this.quantityValue++;
  }

  /**
   * Disable increase
   *
   * @return  {[type]}  [return description]
   */

  disableIncrease() {
    this.increaseButton.classList.toggle(this.settings.isDisabled, this.quantityValue >= this.maxValue && this.maxValue !== null);
  }

  /**
   * Update cart
   *
   * @return  {Void}
   */

  updateCart() {
    const event = new CustomEvent('theme:cart:update', {
      bubbles: true,
      detail: {
        id: this.cartItemID,
        quantity: this.quantityValue,
        valueIsEmpty: this.emptyField,
      },
    });

    this.holder.dispatchEvent(event);
  }
}

export default QuantityCounter;
