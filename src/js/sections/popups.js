import * as a11y from '../vendor/theme-scripts/theme-a11y';
import fadeIn from '../util/fade-in';
import fadeOut from '../util/fade-out';
import {newsletterCheckForResultSection} from '../globals/newsletter';
import {register} from '../vendor/theme-scripts/theme-sections';
import {PopupCookie} from '../globals/popup-cookie';
import {isDesktop, isMobile} from '../util/media-query';

const selectors = {
  largePromo: '[data-large-promo]',
  largePromoInner: '[data-large-promo-inner]',
  trackingInner: '[data-tracking-consent-inner]',
  tracking: '[data-tracking-consent]',
  trackingAccept: '[data-confirm-cookies]',
  cartBar: 'cart-bar',
  close: '[data-close-modal]',
  modalUnderlay: '[data-modal-underlay]',
  modalBody: '[data-modal-body]',
  newsletterPopup: '[data-newsletter]',
  newsletterPopupHolder: '[data-newsletter-holder]',
  newsletterClose: '[data-newsletter-close]',
  newsletterHeading: '[data-newsletter-heading]',
  newsletterField: '[data-newsletter-field]',
  promoPopup: '[data-promo-text]',
  newsletterForm: '[data-newsletter-form]',
  delayAttribite: 'data-popup-delay',
  cookieNameAttribute: 'data-cookie-name',
  dataTargetReferrer: 'data-target-referrer',
};

const classes = {
  hidden: 'hidden',
  hasValue: 'has-value',
  cartBarVisible: 'cart-bar-visible',
  isVisible: 'is-visible',
  success: 'has-success',
  selected: 'selected',
  hasBlockSelected: 'has-block-selected',
  mobile: 'mobile',
  desktop: 'desktop',
  bottom: 'bottom',
};

const attributes = {
  enable: 'data-enable',
};

let sections = {};

class DelayShow {
  constructor(holder, element, callback = null) {
    this.element = element;
    this.delay = holder.getAttribute(selectors.delayAttribite);
    this.isSubmitted = window.location.href.indexOf('accepts_marketing') !== -1 || window.location.href.indexOf('customer_posted=true') !== -1;
    this.callback = callback;
    this.showPopupOnScrollEvent = () => this.showPopupOnScroll();

    if (this.delay === 'always' || this.isSubmitted) {
      this.always();
    }

    if (this.delay && this.delay.includes('delayed') && !this.isSubmitted) {
      const seconds = this.delay.includes('_') ? parseInt(this.delay.split('_')[1]) : 10;
      this.delayed(seconds);
    }

    if (this.delay === 'bottom' && !this.isSubmitted) {
      this.bottom();
    }

    if (this.delay === 'idle' && !this.isSubmitted) {
      this.idle();
    }
  }

  always() {
    fadeIn(this.element, null, this.callback);
  }

  delayed(seconds = 10) {
    // Show popup after specific seconds
    setTimeout(() => {
      fadeIn(this.element, null, this.callback);
    }, seconds * 1000);
  }

  // Idle for 1 min
  idle() {
    let timer = 0;
    let idleTime = 60000;
    const documentEvents = ['mousemove', 'mousedown', 'click', 'touchmove', 'touchstart', 'touchend', 'keydown', 'keypress'];
    const windowEvents = ['load', 'resize', 'scroll'];

    const startTimer = () => {
      timer = setTimeout(() => {
        timer = 0;
        fadeIn(this.element, null, this.callback);
      }, idleTime);

      documentEvents.forEach((eventType) => {
        document.addEventListener(eventType, resetTimer);
      });

      windowEvents.forEach((eventType) => {
        window.addEventListener(eventType, resetTimer);
      });
    };

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      documentEvents.forEach((eventType) => {
        document.removeEventListener(eventType, resetTimer);
      });

      windowEvents.forEach((eventType) => {
        window.removeEventListener(eventType, resetTimer);
      });

      startTimer();
    };

    startTimer();
  }

  // Scroll to the bottom of the page
  bottom() {
    document.addEventListener('theme:scroll', this.showPopupOnScrollEvent);
  }

  showPopupOnScroll() {
    if (window.scrollY + window.innerHeight >= document.body.clientHeight) {
      fadeIn(this.element, null, this.callback);
      document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
    }
  }

  onUnload() {
    document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
  }
}

class TargetReferrer {
  constructor(el) {
    this.el = el;
    this.locationPath = location.href;

    if (!this.el.hasAttribute(selectors.dataTargetReferrer)) {
      return false;
    }

    this.init();
  }

  init() {
    if (this.locationPath.indexOf(this.el.getAttribute(selectors.dataTargetReferrer)) === -1 && !window.Shopify.designMode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}

class LargePopup {
  constructor(el) {
    this.popup = el;
    this.modal = this.popup.querySelector(selectors.largePromoInner);
    this.modalBody = this.popup.querySelector(selectors.modalBody);
    this.close = this.popup.querySelector(selectors.close);
    this.underlay = this.popup.querySelector(selectors.modalUnderlay);
    this.form = this.popup.querySelector(selectors.newsletterForm);
    this.cookie = new PopupCookie(this.popup.getAttribute(selectors.cookieNameAttribute), 'user_has_closed');
    this.isTargeted = new TargetReferrer(this.popup);
    this.a11y = a11y;

    this.init();
  }

  init() {
    const cookieExists = this.cookie.read() !== false;
    const targetMobile = this.popup.classList.contains(classes.mobile);
    const targetDesktop = this.popup.classList.contains(classes.desktop);
    const isMobileView = isMobile();
    let targetMatches = true;

    if ((targetMobile && !isMobileView) || (targetDesktop && isMobileView)) {
      targetMatches = false;
    }

    if (!targetMatches) {
      this.scrollUnlock();
      return;
    }

    if (!cookieExists || window.Shopify.designMode) {
      if (!window.Shopify.designMode) {
        new DelayShow(this.popup, this.modal, () => this.scrollLock());
      }

      if (this.form && this.form.classList.contains(classes.success)) {
        this.checkForSuccess();
      }

      this.initClosers();
    }
  }

  checkForSuccess() {
    fadeIn(this.modal, null, () => this.scrollLock());
    this.cookie.write();
  }

  initClosers() {
    this.close.addEventListener('click', this.closeModal.bind(this));
    this.underlay.addEventListener('click', this.closeModal.bind(this));
  }

  closeModal(e) {
    e.preventDefault();
    fadeOut(this.modal);
    this.cookie.write();
    this.scrollUnlock();
  }

  scrollLock() {
    if (window.getComputedStyle(this.popup).display !== 'none') {
      this.a11y.trapFocus(this.modal);
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.modalBody}));
    }
  }

  scrollUnlock() {
    this.a11y.removeTrapFocus();
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
  }

  onBlockSelect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeIn(this.modal, null, () => this.scrollLock());
      this.popup.classList.add(classes.selected);
      this.popup.parentNode.classList.add(classes.hasBlockSelected);
    }
  }

  onBlockDeselect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeOut(this.modal);
      this.scrollUnlock();
      this.popup.classList.remove(classes.selected);
      this.popup.parentNode.classList.remove(classes.hasBlockSelected);
    }
  }
}

class Tracking {
  constructor(el) {
    this.popup = el;
    this.modal = document.querySelector(selectors.tracking);
    this.acceptButton = this.modal.querySelector(selectors.trackingAccept);
    this.enable = this.modal.getAttribute(attributes.enable) === 'true';
    this.showPopup = false;

    window.Shopify.loadFeatures(
      [
        {
          name: 'consent-tracking-api',
          version: '0.1',
        },
      ],
      (error) => {
        if (error) {
          throw error;
        }

        const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
        const userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();

        this.showPopup = !userCanBeTracked && userTrackingConsent === 'no_interaction' && this.enable;

        if (window.Shopify.designMode) {
          this.showPopup = true;
        }

        this.init();
      }
    );
  }

  init() {
    if (this.showPopup) {
      fadeIn(this.modal);
    }

    this.clickEvents();
  }

  clickEvents() {
    this.acceptButton.addEventListener('click', (event) => {
      event.preventDefault();

      window.Shopify.customerPrivacy.setTrackingConsent(true, () => fadeOut(this.modal));

      document.documentElement.style.setProperty('--cookie-bar-height', '0px');
    });

    document.addEventListener('trackingConsentAccepted', () => {
      // trackingConsentAccepted event fired
    });
  }

  onBlockSelect(evt) {
    if (this.popup.contains(evt.target) && this.showPopup) {
      fadeIn(this.modal);
      this.popup.classList.add(classes.selected);
      this.popup.parentNode.classList.add(classes.hasBlockSelected);
    }
  }

  onBlockDeselect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeOut(this.modal);
      this.popup.classList.remove(classes.selected);
      this.popup.parentNode.classList.remove(classes.hasBlockSelected);
    }
  }
}

class PromoText {
  constructor(el) {
    this.popup = el;
    this.close = this.popup.querySelector(selectors.close);
    this.cookie = new PopupCookie(this.popup.getAttribute(selectors.cookieNameAttribute), 'user_has_closed');
    this.isTargeted = new TargetReferrer(this.popup);

    this.init();
  }

  init() {
    const cookieExists = this.cookie.read() !== false;

    if (!cookieExists || window.Shopify.designMode) {
      if (!window.Shopify.designMode) {
        new DelayShow(this.popup, this.popup);
      } else {
        fadeIn(this.popup);
      }

      this.clickEvents();
    }
  }

  clickEvents() {
    this.close.addEventListener('click', (event) => {
      event.preventDefault();

      fadeOut(this.popup);
      this.cookie.write();
    });
  }

  onBlockSelect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeIn(this.popup);
      this.popup.classList.add(classes.selected);
      this.popup.parentNode.classList.add(classes.hasBlockSelected);
    }
  }

  onBlockDeselect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeOut(this.popup);
      this.popup.classList.remove(classes.selected);
      this.popup.parentNode.classList.remove(classes.hasBlockSelected);
    }
  }
}

class NewsletterPopup {
  constructor(el) {
    this.popup = el;
    this.holder = this.popup.querySelector(selectors.newsletterPopupHolder);
    this.close = this.popup.querySelector(selectors.newsletterClose);
    this.heading = this.popup.querySelector(selectors.newsletterHeading);
    this.newsletterField = this.popup.querySelector(selectors.newsletterField);
    this.cookie = new PopupCookie(this.popup.getAttribute(selectors.cookieNameAttribute), 'newsletter_is_closed');
    this.form = this.popup.querySelector(selectors.newsletterForm);
    this.isTargeted = new TargetReferrer(this.popup);
    this.resetClassTimer = 0;

    this.init();
  }

  init() {
    const cookieExists = this.cookie.read() !== false;
    const submissionSuccess = window.location.search.indexOf('?customer_posted=true') !== -1;
    const classesString = [...this.holder.classList].toString();
    const isPositionBottom = classesString.includes(classes.bottom);

    if (submissionSuccess) {
      this.delay = 0;
    }

    if (!cookieExists || window.Shopify.designMode) {
      this.show();

      if (this.form.classList.contains(classes.success)) {
        this.checkForSuccess();
      }
    }

    if (isPositionBottom) {
      this.observeCartBar();
    }
  }

  show() {
    if (!window.Shopify.designMode) {
      new DelayShow(this.popup, this.holder);
    } else {
      fadeIn(this.holder);
    }

    this.showForm();
    this.inputField();
    this.closePopup();
  }

  checkForSuccess() {
    fadeIn(this.holder);
    this.cookie.write();
  }

  observeCartBar() {
    this.cartBar = document.getElementById(selectors.cartBar);

    if (!this.cartBar) return;

    const config = {attributes: true, childList: false, subtree: false};
    let isVisible = this.cartBar.classList.contains(classes.isVisible);
    document.body.classList.toggle(classes.cartBarVisible, isVisible);

    // Callback function to execute when mutations are observed
    const callback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes') {
          isVisible = mutation.target.classList.contains(classes.isVisible);
          document.body.classList.toggle(classes.cartBarVisible, isVisible);
        }
      }
    };

    this.observer = new MutationObserver(callback);
    this.observer.observe(this.cartBar, config);
  }

  showForm() {
    this.heading.addEventListener('click', (event) => {
      event.preventDefault();

      this.heading.classList.add(classes.hidden);
      this.form.classList.remove(classes.hidden);
      this.newsletterField.focus();
    });

    this.heading.addEventListener('keyup', (event) => {
      if (event.code === window.theme.keyboardKeys.ENTER) {
        this.heading.dispatchEvent(new Event('click'));
      }
    });
  }

  closePopup() {
    this.close.addEventListener('click', (event) => {
      event.preventDefault();

      fadeOut(this.holder);
      this.cookie.write();
    });
  }

  inputField() {
    const setClass = () => {
      // Reset timer if exists and is active
      if (this.resetClassTimer) {
        clearTimeout(this.resetClassTimer);
      }

      if (this.newsletterField.value !== '') {
        this.holder.classList.add(classes.hasValue);
      }
    };

    const unsetClass = () => {
      // Reset timer if exists and is active
      if (this.resetClassTimer) {
        clearTimeout(this.resetClassTimer);
      }

      // Reset class
      this.resetClassTimer = setTimeout(() => {
        this.holder.classList.remove(classes.hasValue);
      }, 2000);
    };

    this.newsletterField.addEventListener('input', setClass);
    this.newsletterField.addEventListener('focus', setClass);
    this.newsletterField.addEventListener('focusout', unsetClass);
  }

  onBlockSelect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeIn(this.holder);
      this.popup.classList.add(classes.selected);
      this.popup.parentNode.classList.add(classes.hasBlockSelected);
    }
  }

  onBlockDeselect(evt) {
    if (this.popup.contains(evt.target)) {
      fadeOut(this.holder);
      this.popup.classList.remove(classes.selected);
      this.popup.parentNode.classList.remove(classes.hasBlockSelected);
    }
  }

  onUnload() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

const popupSection = {
  onLoad() {
    sections[this.id] = [];

    const newsletters = this.container.querySelectorAll(selectors.largePromo);
    newsletters.forEach((el) => {
      sections[this.id].push(new LargePopup(el));
    });

    const tracking = this.container.querySelectorAll(selectors.tracking);
    tracking.forEach((el) => {
      sections[this.id].push(new Tracking(el));
    });

    const newsletterPopup = this.container.querySelectorAll(selectors.newsletterPopup);
    newsletterPopup.forEach((el) => {
      sections[this.id].push(new NewsletterPopup(el));
    });

    const promoPopup = this.container.querySelectorAll(selectors.promoPopup);
    promoPopup.forEach((el) => {
      sections[this.id].push(new PromoText(el));
    });
  },

  onBlockSelect(evt) {
    sections[this.id].forEach((el) => {
      if (typeof el.onBlockSelect === 'function') {
        el.onBlockSelect(evt);
      }
    });
  },
  onBlockDeselect(evt) {
    sections[this.id].forEach((el) => {
      if (typeof el.onBlockDeselect === 'function') {
        el.onBlockDeselect(evt);
      }
    });
  },
  onUnload() {
    sections[this.id].forEach((el) => {
      if (typeof el.onUnload === 'function') {
        el.onUnload();
      }
    });
  },
};

register('popups', [popupSection, newsletterCheckForResultSection]);
