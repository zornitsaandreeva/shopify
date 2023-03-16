const selectors = {
  count: 'data-cart-count',
};

class Totals {
  constructor(el) {
    this.section = el;
    this.counts = this.section.querySelectorAll(`[${selectors.count}]`);
    this.cart = null;
    this.listen();
  }

  listen() {
    document.addEventListener(
      'theme:cart:change',
      function (event) {
        this.cart = event.detail.cart;
        this.update();
      }.bind(this)
    );
  }

  update() {
    if (this.cart) {
      this.counts.forEach((count) => {
        count.setAttribute(selectors.count, this.cart.item_count);
        count.innerHTML = this.cart.item_count < 10 ? `${this.cart.item_count}` : '9+';
      });
    }
  }
}
const headerTotals = {
  onLoad() {
    new Totals(this.container);
  },
};

export default headerTotals;
