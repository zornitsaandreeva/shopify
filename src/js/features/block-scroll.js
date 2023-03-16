const selectors = {
  scrollElement: '[data-block-scroll]',
  flickityEnabled: 'flickity-enabled',
};

const sections = {};

class BlockScroll {
  constructor(el) {
    this.container = el.container;
  }

  onBlockSelect(evt) {
    const scrollElement = this.container.querySelector(selectors.scrollElement);
    if (scrollElement && !scrollElement.classList.contains(selectors.flickityEnabled)) {
      const currentElement = evt.srcElement;
      if (currentElement) {
        scrollElement.scrollTo({
          top: 0,
          left: currentElement.offsetLeft,
          behavior: 'smooth',
        });
      }
    }
  }
}

const blockScroll = {
  onLoad() {
    sections[this.id] = new BlockScroll(this);
  },
  onBlockSelect(e) {
    sections[this.id].onBlockSelect(e);
  },
};

export default blockScroll;
