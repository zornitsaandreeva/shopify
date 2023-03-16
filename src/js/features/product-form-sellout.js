const selectors = {
  optionPosition: 'data-option-position',
  optionInput: '[name^="options"], [data-popout-option]',
  optionInputCurrent: '[name^="options"]:checked, [name^="options"][type="hidden"]',
  selectOptionValue: 'data-value',
  popout: '[data-popout]',
};

const classes = {
  soldOut: 'sold-out',
  unavailable: 'unavailable',
  sale: 'sale',
};

/**
 * Variant Sellout Precrime Click Preview
 * I think of this like the precrime machine in Minority report.  It gives a preview
 * of every possible click action, given the current form state.  The logic is:
 *
 * for each clickable name=options[] variant selection element
 * find the value of the form if the element were clicked
 * lookup the variant with those value in the product json
 * clear the classes, add .unavailable if it's not found,
 * and add .sold-out if it is out of stock
 *
 * Caveat: we rely on the option position so we don't need
 * to keep a complex map of keys and values.
 */

class SelloutVariants {
  constructor(section, productJSON) {
    this.container = section;
    this.productJSON = productJSON;
    this.optionElements = this.container.querySelectorAll(selectors.optionInput);

    if (this.productJSON && this.optionElements.length) {
      this.init();
    }
  }

  init() {
    this.update();
  }

  update() {
    this.getCurrentState();

    this.optionElements.forEach((el) => {
      const parent = el.closest(`[${selectors.optionPosition}]`);
      if (!parent) return;
      const val = el.value || el.getAttribute(selectors.selectOptionValue);
      const positionString = parent.getAttribute(selectors.optionPosition);
      // subtract one because option.position in liquid does not count form zero, but JS arrays do
      const position = parseInt(positionString, 10) - 1;
      const selectPopout = el.closest(selectors.popout);

      let newVals = [...this.selections];
      newVals[position] = val;

      const found = this.productJSON.variants.find((element) => {
        // only return true if every option matches our hypothetical selection
        let perfectMatch = true;
        for (let index = 0; index < newVals.length; index++) {
          if (element.options[index] !== newVals[index]) {
            perfectMatch = false;
          }
        }
        return perfectMatch;
      });

      el.classList.remove(classes.soldOut, classes.unavailable);
      el.parentNode.classList.remove(classes.sale);

      if (selectPopout) {
        selectPopout.classList.remove(classes.soldOut, classes.unavailable, classes.sale);
      }

      if (typeof found === 'undefined') {
        el.classList.add(classes.unavailable);

        if (selectPopout) {
          selectPopout.classList.add(classes.unavailable);
        }
      } else if (found && found.available === false) {
        el.classList.add(classes.soldOut);

        if (selectPopout) {
          selectPopout.classList.add(classes.soldOut);
        }
      }

      if (found && found.compare_at_price > found.price && theme.settings.variantOnSale) {
        el.parentNode.classList.add(classes.sale);
      }
    });
  }

  getCurrentState() {
    this.selections = [];

    const options = this.container.querySelectorAll(selectors.optionInputCurrent);
    if (options.length) {
      options.forEach((element) => {
        const elemValue = element.value;
        if (elemValue && elemValue !== '') {
          this.selections.push(elemValue);
        }
      });
    }
  }
}

export default SelloutVariants;
