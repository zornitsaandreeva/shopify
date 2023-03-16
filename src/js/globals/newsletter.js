import {getWindowHeight, getWindowWidth} from '../util/media-query';
import scrollTo from '../util/scroll-to';

import {PopupCookie} from './popup-cookie';

const selectors = {
  newsletterForm: '[data-newsletter-form]',
  newsletterHeading: '[data-newsletter-heading]',
  newsletterPopup: '[data-newsletter]',
};

const classes = {
  success: 'has-success',
  error: 'has-error',
  hidden: 'hidden',
};

const attributes = {
  cookieNameAttribute: 'data-cookie-name',
};

const sections = {};

class NewsletterCheckForResult {
  constructor(newsletter) {
    this.sessionStorage = window.sessionStorage;
    this.newsletter = newsletter;
    this.popup = this.newsletter.closest(selectors.newsletterPopup);
    if (this.popup) {
      this.cookie = new PopupCookie(this.popup.getAttribute(attributes.cookieNameAttribute), 'user_has_closed', null);
    }

    this.stopSubmit = true;
    this.isChallengePage = false;
    this.formID = null;

    this.checkForChallengePage();

    this.newsletterSubmit = (e) => this.newsletterSubmitEvent(e);

    if (!this.isChallengePage) {
      this.init();
    }
  }

  init() {
    this.newsletter.addEventListener('submit', this.newsletterSubmit);

    this.showMessage();
  }

  newsletterSubmitEvent(e) {
    if (this.stopSubmit) {
      e.preventDefault();
      e.stopImmediatePropagation();

      this.removeStorage();
      this.writeStorage();
      this.stopSubmit = false;
      this.newsletter.submit();
    }
  }

  checkForChallengePage() {
    this.isChallengePage = window.location.pathname === '/challenge';
  }

  writeStorage() {
    if (this.sessionStorage !== undefined) {
      this.sessionStorage.setItem('newsletter_form_id', this.newsletter.id);
    }
  }

  readStorage() {
    this.formID = this.sessionStorage.getItem('newsletter_form_id');
  }

  removeStorage() {
    this.sessionStorage.removeItem('newsletter_form_id');
  }

  showMessage() {
    this.readStorage();

    if (this.newsletter.id === this.formID) {
      const newsletter = document.getElementById(this.formID);
      const newsletterHeading = newsletter.parentElement.querySelector(selectors.newsletterHeading);
      const submissionSuccess = window.location.search.indexOf('?customer_posted=true') !== -1;
      const submissionFailure = window.location.search.indexOf('accepts_marketing') !== -1;

      if (submissionSuccess) {
        newsletter.classList.remove(classes.error);
        newsletter.classList.add(classes.success);

        if (newsletterHeading) {
          newsletterHeading.classList.add(classes.hidden);
          newsletter.classList.remove(classes.hidden);
        }

        if (this.popup) {
          this.cookie.write();
        }
      } else if (submissionFailure) {
        newsletter.classList.remove(classes.success);
        newsletter.classList.add(classes.error);

        if (newsletterHeading) {
          newsletterHeading.classList.add(classes.hidden);
          newsletter.classList.remove(classes.hidden);
        }
      }

      if (submissionSuccess || submissionFailure) {
        window.addEventListener('load', () => {
          this.scrollToForm(newsletter);
        });
      }
    }
  }

  scrollToForm(newsletter) {
    const rect = newsletter.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= getWindowHeight() && rect.right <= getWindowWidth();

    if (!isVisible) {
      setTimeout(() => {
        scrollTo(newsletter.getBoundingClientRect().top);
      }, 500);
    }
  }

  unload() {
    this.newsletter.removeEventListener('submit', this.newsletterSubmit);
  }
}

const newsletterCheckForResultSection = {
  onLoad() {
    sections[this.id] = [];
    const newsletters = this.container.querySelectorAll(selectors.newsletterForm);
    newsletters.forEach((form) => {
      sections[this.id].push(new NewsletterCheckForResult(form));
    });
  },
  onUnload() {
    sections[this.id].forEach((form) => {
      if (typeof form.unload === 'function') {
        form.unload();
      }
    });
  },
};

export {newsletterCheckForResultSection};
