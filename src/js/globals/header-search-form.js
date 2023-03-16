import debounce from '../util/debounce';

const selectors = {
  inputSearch: 'input[type="search"]',
  focusedElements: '[aria-selected="true"] a',
  resetButton: 'button[type="reset"]',
};

const classes = {
  hidden: 'hidden',
};

export default class HeaderSearchForm extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector(selectors.inputSearch);
    this.resetButton = this.querySelector(selectors.resetButton);

    if (this.input) {
      this.input.form.addEventListener('reset', this.onFormReset.bind(this));
      this.input.addEventListener(
        'input',
        debounce((event) => {
          this.onChange(event);
        }, 300).bind(this)
      );
    }
  }

  toggleResetButton() {
    const resetIsHidden = this.resetButton.classList.contains(classes.hidden);
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.classList.remove(classes.hidden);
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.classList.add(classes.hidden);
    }
  }

  onChange() {
    this.toggleResetButton();
  }

  shouldResetForm() {
    return !document.querySelector(selectors.focusedElements);
  }

  onFormReset(event) {
    // Prevent default so the form reset doesn't set the value gotten from the url on page load
    event.preventDefault();
    // Don't reset if the user has selected an element on the predictive search dropdown
    if (this.shouldResetForm()) {
      this.input.value = '';
      this.input.focus();
      this.toggleResetButton();
    }
  }
}

customElements.define('header-search-form', HeaderSearchForm);
