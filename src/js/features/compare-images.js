const selectors = {
  imagesHolder: '[data-images-holder]',
  imageHolder: '[data-image-holder]',
  imageElement: '[data-image-element]',
  imagesButton: '[data-images-button]',
  dataStartPosition: 'data-start-position',
};

const sections = {};

class CompareImages {
  constructor(section) {
    this.imagesHolder = section;

    if (this.imagesHolder) {
      this.imageHolder = this.imagesHolder.querySelector(selectors.imageHolder);
      this.imageElement = this.imagesHolder.querySelector(selectors.imageElement);
      this.imagesButton = this.imagesHolder.querySelector(selectors.imagesButton);
      this.startPosition = this.imagesHolder.hasAttribute(selectors.dataStartPosition) ? this.imagesHolder.getAttribute(selectors.dataStartPosition) : 0;
      this.startX = 0;
      this.x = 0;
      this.changeValuesEvent = (event) => this.changeValues(event);
      this.onMoveEvent = (event) => this.onMove(event);
      this.onStopEvent = (event) => this.onStop(event);
      this.onStartEvent = (event) => this.onStart(event);

      this.init();
      document.addEventListener('theme:resize', this.changeValuesEvent);
    }
  }

  init() {
    this.changeValues();
    this.imagesButton.addEventListener('mousedown', this.onStartEvent);
    this.imagesButton.addEventListener('touchstart', this.onStartEvent);
  }

  changeValues(event) {
    const imagesHolderWidth = this.imagesHolder.offsetWidth;
    const buttonWidth = this.imagesButton.offsetWidth;

    if (!event || (event && event.type !== 'touchmove' && event.type !== 'mousemove')) {
      this.imageElement.style.width = `${imagesHolderWidth}px`;
      this.imageHolder.style.width = `${100 - parseInt(this.startPosition)}%`;

      if (this.startPosition !== 0) {
        const newButtonPositionPixels = (imagesHolderWidth * parseInt(this.startPosition)) / 100;
        this.x = newButtonPositionPixels - buttonWidth / 2;
      }
    }

    if (this.x > imagesHolderWidth - buttonWidth) {
      this.x = imagesHolderWidth - buttonWidth;
    } else if (this.x < 0) {
      this.x = 0;
    }

    this.imagesButton.style.left = `${(this.x / imagesHolderWidth) * 100}%`;
    this.imageHolder.style.width = `${100 - ((this.x + buttonWidth / 2) / imagesHolderWidth) * 100}%`;
  }

  onStart(event) {
    event.preventDefault();
    let eventTouch = event;

    if (event.touches) {
      eventTouch = event.touches[0];
    }

    this.x = this.imagesButton.offsetLeft;
    this.startX = eventTouch.pageX - this.x;

    this.imagesHolder.addEventListener('mousemove', this.onMoveEvent);
    this.imagesHolder.addEventListener('mouseup', this.onStopEvent);
    this.imagesHolder.addEventListener('touchmove', this.onMoveEvent);
    this.imagesHolder.addEventListener('touchend', this.onStopEvent);
  }

  onMove(event) {
    let eventTouch = event;

    if (event.touches) {
      eventTouch = event.touches[0];
    }

    this.x = eventTouch.pageX - this.startX;

    this.changeValues(event);
  }

  onStop(event) {
    this.imagesHolder.removeEventListener('mousemove', this.onMoveEvent);
    this.imagesHolder.removeEventListener('mouseup', this.onStopEvent);
    this.imagesHolder.removeEventListener('touchmove', this.onMoveEvent);
    this.imagesHolder.removeEventListener('touchend', this.onStopEvent);
  }

  onUnload() {
    if (this.changeValuesEvent) {
      document.removeEventListener('theme:resize', this.changeValuesEvent);
    }
  }
}

const compareImages = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(selectors.imagesHolder);
    els.forEach((el) => {
      sections[this.id].push(new CompareImages(el));
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

export {compareImages, CompareImages};
