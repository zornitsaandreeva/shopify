const selectors = {
  popoutWrapper: '[data-popout]',
  popoutList: '[data-popout-list]',
  popoutToggle: '[data-popout-toggle]',
  popoutToggleText: '[data-popout-toggle-text]',
  popoutToggleTextValue: 'data-popout-toggle-text',
  popoutInput: '[data-popout-input]',
  popoutOptions: '[data-popout-option]',
  popoutPrevent: 'data-popout-prevent',
  popoutQuantity: 'data-quantity-field',
  dataValue: 'data-value',
  ariaExpanded: 'aria-expanded',
  ariaCurrent: 'aria-current',
  productGridImage: '[data-product-image]',
  productGrid: '[data-product-grid-item]',
};

const classes = {
  listVisible: 'popout-list--visible',
  visible: 'is-visible',
  active: 'is-active',
  selectPopoutTop: 'select-popout--top',
};

let sections = {};

class Popout {
  constructor(popout) {
    this.container = popout;
    this.popoutList = this.container.querySelector(selectors.popoutList);
    this.popoutToggle = this.container.querySelector(selectors.popoutToggle);
    this.popoutToggleText = this.container.querySelector(selectors.popoutToggleText);
    this.popoutInput = this.container.querySelector(selectors.popoutInput);
    this.popoutOptions = this.container.querySelectorAll(selectors.popoutOptions);
    this.productGrid = this.popoutList.closest(selectors.productGrid);
    this.popoutPrevent = this.container.getAttribute(selectors.popoutPrevent) === 'true';
    this.popupToggleFocusoutEvent = (evt) => this.popupToggleFocusout(evt);
    this.popupListFocusoutEvent = (evt) => this.popupListFocusout(evt);
    this.popupToggleClickEvent = (evt) => this.popupToggleClick(evt);
    this.containerKeyupEvent = (evt) => this.containerKeyup(evt);
    this.bodyClickEvent = (evt) => this.bodyClick(evt);

    this._connectOptions();
    this._connectToggle();
    this._onFocusOut();
    this.popupListMaxWidth();
  }

  popupToggleClick(evt) {
    const button = evt.currentTarget;
    const ariaExpanded = button.getAttribute(selectors.ariaExpanded) === 'true';

    if (this.productGrid) {
      const productGridItemImage = this.productGrid.querySelector(selectors.productGridImage);

      if (productGridItemImage) {
        productGridItemImage.classList.toggle(classes.visible, !ariaExpanded);
      }

      this.popoutList.style.maxHeight = `${Math.abs(this.popoutToggle.getBoundingClientRect().bottom - this.productGrid.getBoundingClientRect().bottom)}px`;
    }

    evt.currentTarget.setAttribute(selectors.ariaExpanded, !ariaExpanded);
    this.popoutList.classList.toggle(classes.listVisible);
    this.popupListMaxWidth();

    this.toggleListPosition();
  }

  popupToggleFocusout(evt) {
    const popoutLostFocus = this.container.contains(evt.relatedTarget);

    if (!popoutLostFocus) {
      this._hideList();
    }
  }

  popupListFocusout(evt) {
    const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
    const isVisible = this.popoutList.classList.contains(classes.listVisible);

    if (isVisible && !childInFocus) {
      this._hideList();
    }
  }

  toggleListPosition() {
    const popoutHolder = this.popoutList.closest(selectors.popoutWrapper);
    const button = popoutHolder.querySelector(selectors.popoutToggle);
    const ariaExpanded = button.getAttribute(selectors.ariaExpanded) === 'true';
    const windowBottom = window.innerHeight;
    const bottom = this.popoutList.getBoundingClientRect().bottom;

    const removeTopClass = () => {
      popoutHolder.classList.remove(classes.selectPopoutTop);
      this.popoutList.removeEventListener('transitionend', removeTopClass);
    };

    if (ariaExpanded) {
      if (windowBottom < bottom) {
        popoutHolder.classList.add(classes.selectPopoutTop);
      }
    } else {
      this.popoutList.addEventListener('transitionend', removeTopClass);
    }
  }

  popupListMaxWidth() {
    this.popoutList.style.maxWidth = `${parseInt(document.body.clientWidth - this.popoutList.getBoundingClientRect().left)}px`;
  }

  popupOptionsClick(evt) {
    const link = evt.target.closest(selectors.popoutOptions);
    if (link.attributes.href.value === '#') {
      evt.preventDefault();

      let attrValue = '';

      if (evt.currentTarget.getAttribute(selectors.dataValue)) {
        attrValue = evt.currentTarget.getAttribute(selectors.dataValue);
      }

      this.popoutInput.value = attrValue;

      if (this.popoutPrevent) {
        const currentTarget = evt.currentTarget.parentElement;
        const listTargetElement = this.popoutList.querySelector(`.${classes.active}`);
        const targetAttribute = this.popoutList.querySelector(`[${selectors.ariaCurrent}]`);

        this.popoutInput.dispatchEvent(new Event('change'));

        if (listTargetElement) {
          listTargetElement.classList.remove(classes.active);
          currentTarget.classList.add(classes.active);
        }

        if (this.popoutInput.hasAttribute(selectors.popoutQuantity) && !currentTarget.nextSibling) {
          this.container.classList.add(classes.active);
        }

        if (targetAttribute && targetAttribute.hasAttribute(`${selectors.ariaCurrent}`)) {
          targetAttribute.removeAttribute(`${selectors.ariaCurrent}`);
          evt.currentTarget.setAttribute(`${selectors.ariaCurrent}`, 'true');
        }

        if (attrValue !== '') {
          this.popoutToggleText.textContent = attrValue;

          if (this.popoutToggleText.hasAttribute(selectors.popoutToggleTextValue) && this.popoutToggleText.getAttribute(selectors.popoutToggleTextValue) !== '') {
            this.popoutToggleText.setAttribute(selectors.popoutToggleTextValue, attrValue);
          }
        }
        this.popupToggleFocusout(evt);
        this.popupListFocusout(evt);
      } else {
        this._submitForm(attrValue);
      }
    }
  }

  containerKeyup(evt) {
    if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
      return;
    }
    this._hideList();
    this.popoutToggle.focus();
  }

  bodyClick(evt) {
    const isOption = this.container.contains(evt.target);
    const isVisible = this.popoutList.classList.contains(classes.listVisible);

    if (isVisible && !isOption) {
      this._hideList();
    }
  }

  unload() {
    document.body.removeEventListener('click', this.bodyClickEvent);
  }

  _connectToggle() {
    this.popoutToggle.addEventListener('click', this.popupToggleClickEvent);
  }

  _connectOptions() {
    if (this.popoutOptions.length) {
      this.popoutOptions.forEach((element) => {
        element.addEventListener('click', (evt) => this.popupOptionsClick(evt));
      });
    }
  }

  _onFocusOut() {
    this.popoutToggle.addEventListener('focusout', this.popupToggleFocusoutEvent);

    this.popoutList.addEventListener('focusout', this.popupListFocusoutEvent);

    this.container.addEventListener('keyup', this.containerKeyupEvent);

    document.body.addEventListener('click', this.bodyClickEvent);
  }

  _submitForm() {
    const form = this.container.closest('form');
    if (form) {
      form.submit();
    }
  }

  _hideList() {
    this.popoutList.classList.remove(classes.listVisible);
    this.popoutToggle.setAttribute(selectors.ariaExpanded, false);
    this.toggleListPosition();
  }
}

const popoutSection = {
  onLoad() {
    sections[this.id] = [];
    const wrappers = this.container.querySelectorAll(selectors.popoutWrapper);
    wrappers.forEach((wrapper) => {
      sections[this.id].push(new Popout(wrapper));
    });
  },
  onUnload() {
    sections[this.id].forEach((popout) => {
      if (typeof popout.unload === 'function') {
        popout.unload();
      }
    });
  },
};

export {Popout, popoutSection};
