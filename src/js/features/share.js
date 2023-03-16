const selectors = {
  section: 'data-section-type',
  shareButton: '[data-share-button]',
  shareMessage: '[data-share-message]',
};

const classes = {
  visible: 'is-visible',
};

class ShareButton extends HTMLElement {
  constructor() {
    super();

    this.container = this.closest(`[${selectors.section}]`);
    this.shareButton = this.querySelector(selectors.shareButton);
    this.shareMessage = this.querySelector(selectors.shareMessage);
    this.urlToShare = this.shareButton.dataset.shareUrl ? this.shareButton.dataset.shareUrl : document.location.href;

    this.init();
    this.updateShareLink();
  }

  init() {
    if (navigator.share) {
      this.shareButton.addEventListener('click', () => {
        navigator.share({url: this.urlToShare, title: document.title});
      });
    } else {
      this.shareButton.addEventListener('click', this.copyToClipboard.bind(this));
    }
  }

  updateShareLink() {
    if (this.container.getAttribute(selectors.section) == 'product') {
      this.container.addEventListener('theme:variant:change', (event) => {
        if (event.detail.variant) {
          this.urlToShare = `${this.urlToShare.split('?')[0]}?variant=${event.detail.variant.id}`;
        }
      });
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.urlToShare).then(() => {
      this.shareMessage.classList.add(classes.visible);

      const removeVisibleClass = () => {
        this.shareMessage.classList.remove(classes.visible);
        this.shareMessage.removeEventListener('animationend', removeVisibleClass);
      };

      this.shareMessage.addEventListener('animationend', removeVisibleClass);
    });
  }
}

export {ShareButton};
