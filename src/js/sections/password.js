import {register} from '../vendor/theme-scripts/theme-sections';
import * as a11y from '../vendor/theme-scripts/theme-a11y';
import fadeIn from '../util/fade-in';
import fadeOut from '../util/fade-out';

const selectors = {
  passwordLogin: '[data-password-login]',
  passwordModal: '[data-password-modal]',
  modalBody: '[data-modal-body]',
  close: '[data-modal-close]',
  loginErrors: '#login_form .errors',
};

const classes = {
  open: 'is-open',
};

class Password {
  constructor(section) {
    this.container = section.container;
    this.passwordLogin = this.container.querySelectorAll(selectors.passwordLogin);
    this.modal = this.container.querySelector(selectors.passwordModal);
    this.modalBody = this.container.querySelector(selectors.modalBody);
    this.closeButtons = this.container.querySelectorAll(selectors.close);
    this.a11y = a11y;
    this.loginErrors = this.container.querySelector(selectors.loginErrors);
    this.init();
  }

  init() {
    if (this.passwordLogin.length && this.modal && this.modalBody) {
      this.passwordLogin.forEach((passwordLogin) => {
        passwordLogin.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      });

      if (this.closeButtons.length) {
        this.closeButtons.forEach((closeButton) => {
          closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal();
          });
        });
      }

      if (this.loginErrors) {
        this.openModal();
      }
    }
  }

  openModal() {
    fadeIn(this.modal, 'block', () => {
      this.modal.classList.add(classes.open);
    });
    this.scrollLock();
  }

  closeModal() {
    fadeOut(this.modal);
    this.modal.classList.remove(classes.open);
    this.scrollUnlock();
  }

  scrollLock() {
    if (window.getComputedStyle(this.modal).display !== 'none') {
      this.a11y.trapFocus(this.modal);
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.modalBody}));
    }
  }

  scrollUnlock() {
    this.a11y.removeTrapFocus();
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }
}

const passwordSection = {
  onLoad() {
    new Password(this);
  },
};

register('password-template', passwordSection);
