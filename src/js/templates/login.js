const selectors = {
  form: '[data-account-form]',
  showReset: '[data-show-reset]',
  hideReset: '[data-hide-reset]',
  recover: '[data-recover-password]',
  recoverSuccess: '[data-recover-success]',
  login: '[data-login-form]',
  recoverHash: '#recover',
  hideClass: 'is-hidden',
};

class Login {
  constructor(form) {
    this.form = form;
    this.showButton = form.querySelector(selectors.showReset);
    this.hideButton = form.querySelector(selectors.hideReset);
    this.recover = form.querySelector(selectors.recover);
    this.recoverSuccess = form.querySelector(selectors.recoverSuccess);
    this.login = form.querySelector(selectors.login);
    this.init();
  }

  init() {
    if (window.location.hash == selectors.recoverHash || this.recoverSuccess) {
      this.showRecoverPasswordForm();
    } else {
      this.hideRecoverPasswordForm();
    }
    this.showButton.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        this.showRecoverPasswordForm();
      }.bind(this),
      false
    );
    this.hideButton.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        this.hideRecoverPasswordForm();
      }.bind(this),
      false
    );
  }

  showRecoverPasswordForm() {
    this.login.classList.add(selectors.hideClass);
    this.recover.classList.remove(selectors.hideClass);
    window.location.hash = selectors.recoverHash;
    return false;
  }

  hideRecoverPasswordForm() {
    this.recover.classList.add(selectors.hideClass);
    this.login.classList.remove(selectors.hideClass);
    window.location.hash = '';
    return false;
  }
}

const loginForm = document.querySelector(selectors.form);
if (loginForm) {
  new Login(loginForm);
}
