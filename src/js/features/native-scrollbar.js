const selectors = {
  scrollbarAttribute: 'data-scrollbar',
  scrollbar: 'data-scrollbar-slider',
  scrollbarSlideFullWidth: 'data-scrollbar-slide-fullwidth',
  scrollbarArrowPrev: '[data-scrollbar-arrow-prev]',
  scrollbarArrowNext: '[data-scrollbar-arrow-next]',
};
const classes = {
  hidden: 'is-hidden',
};
const settings = {
  delay: 200,
};

class NativeScrollbar {
  constructor(scrollbar) {
    this.scrollbar = scrollbar;

    this.arrowNext = this.scrollbar.parentNode.querySelector(selectors.scrollbarArrowNext);
    this.arrowPrev = this.scrollbar.parentNode.querySelector(selectors.scrollbarArrowPrev);

    if (this.scrollbar.hasAttribute(selectors.scrollbarAttribute)) {
      this.init();
      this.resize();
    }

    if (this.scrollbar.hasAttribute(selectors.scrollbar)) {
      this.scrollToVisibleElement();
    }
  }

  init() {
    if (this.arrowNext && this.arrowPrev) {
      this.toggleNextArrow();

      this.events();
    }
  }

  resize() {
    document.addEventListener('theme:resize', () => {
      this.toggleNextArrow();
    });
  }

  events() {
    this.arrowNext.addEventListener('click', (event) => {
      event.preventDefault();

      this.goToNext();
    });

    this.arrowPrev.addEventListener('click', (event) => {
      event.preventDefault();

      this.goToPrev();
    });

    this.scrollbar.addEventListener('scroll', () => {
      this.togglePrevArrow();
      this.toggleNextArrow();
    });
  }

  goToNext() {
    const moveWith = this.scrollbar.hasAttribute(selectors.scrollbarSlideFullWidth) ? this.scrollbar.getBoundingClientRect().width : this.scrollbar.getBoundingClientRect().width / 2;
    const position = moveWith + this.scrollbar.scrollLeft;

    this.move(position);

    this.arrowPrev.classList.remove(classes.hidden);

    this.toggleNextArrow();
  }

  goToPrev() {
    const moveWith = this.scrollbar.hasAttribute(selectors.scrollbarSlideFullWidth) ? this.scrollbar.getBoundingClientRect().width : this.scrollbar.getBoundingClientRect().width / 2;
    const position = this.scrollbar.scrollLeft - moveWith;

    this.move(position);

    this.arrowNext.classList.remove(classes.hidden);

    this.togglePrevArrow();
  }

  toggleNextArrow() {
    setTimeout(() => {
      this.arrowNext.classList.toggle(classes.hidden, Math.round(this.scrollbar.scrollLeft + this.scrollbar.getBoundingClientRect().width + 1) >= this.scrollbar.scrollWidth);
    }, settings.delay);
  }

  togglePrevArrow() {
    setTimeout(() => {
      this.arrowPrev.classList.toggle(classes.hidden, this.scrollbar.scrollLeft <= 0);
    }, settings.delay);
  }

  scrollToVisibleElement() {
    [].forEach.call(this.scrollbar.children, (element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();

        this.move(element.offsetLeft - element.clientWidth);
      });
    });
  }

  move(offsetLeft) {
    this.scrollbar.scrollTo({
      top: 0,
      left: offsetLeft,
      behavior: 'smooth',
    });
  }
}

export default NativeScrollbar;
