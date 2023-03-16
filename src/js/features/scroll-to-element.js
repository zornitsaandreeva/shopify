import scrollTo from '../util/scroll-to';

const selectors = {
  scrollToElement: '[data-scroll-to]',
  accordionHolder: '[data-accordion-holder]',
  accordionToggle: '[data-accordion-toggle]',
  tooltip: '[data-tooltip]',
};

const classes = {
  open: 'is-open',
};

const attributes = {
  scrollToElementValue: 'data-scroll-to',
  tooltipStopMousenterValue: 'data-tooltip-stop-mouseenter',
};

const sections = {};

class ScrollToElement {
  constructor(section) {
    this.section = section;
    this.container = section.container;
    this.scrollToButtons = this.container.querySelectorAll(selectors.scrollToElement);

    if (this.scrollToButtons.length) {
      this.init();
    }
  }

  init() {
    this.scrollToButtons.forEach((element) => {
      element.addEventListener('click', () => {
        const target = this.container.querySelector(element.getAttribute(attributes.scrollToElementValue));

        if (!target || element.tagName === 'A') return;

        const accordionToggle = target.querySelector(selectors.accordionToggle);
        let timeoutFlag = false;

        // Open target accordion if they are inside it
        if (accordionToggle) {
          const accordionHolder = accordionToggle.closest(selectors.accordionHolder);

          if (!accordionToggle.classList.contains(classes.open) && accordionHolder && accordionHolder.querySelector(`${selectors.accordionToggle}.${classes.open}`)) {
            timeoutFlag = true;
          }

          if (!accordionToggle.classList.contains(classes.open)) {
            accordionToggle.dispatchEvent(new Event('click'));
          }
        }

        if (timeoutFlag) {
          setTimeout(() => this.scrollToElement(target), 500);
        } else {
          this.scrollToElement(target);
        }
      });
    });
  }

  scrollToElement(element) {
    scrollTo(element.getBoundingClientRect().top + 1);

    const tooltips = document.querySelectorAll(`${selectors.tooltip}:not([${attributes.tooltipStopMousenterValue}])`);
    if (tooltips.length) {
      tooltips.forEach((tooltip) => {
        tooltip.setAttribute(attributes.tooltipStopMousenterValue, '');

        setTimeout(() => {
          tooltip.removeAttribute(attributes.tooltipStopMousenterValue);
        }, 1000);
      });
    }
  }
}

const scrollToElement = {
  onLoad() {
    sections[this.id] = new ScrollToElement(this);
  },
};

export default scrollToElement;
