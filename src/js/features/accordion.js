import slideDown from '../util/slide-down';
import slideUp from '../util/slide-up';
import showElement from '../util/show-element';
import hideElement from '../util/hide-element';
import slideToggle from '../util/slide-toggle';

const selectors = {
  accordionHolder: '[data-accordion-holder]',
  accordion: '[data-accordion]',
  accordionToggle: '[data-accordion-toggle]',
  accordionBody: '[data-accordion-body]',
};

const attributes = {
  accordionExpandValue: 'data-accordion-expand',
  accordionStopClose: 'data-accordion-stop-close',
  accordionBlockValue: 'data-block-id',
};

const classes = {
  open: 'is-open',
  sliding: 'is-sliding',
};

const sections = {};

class GlobalAccordions {
  constructor(el) {
    this.container = el.container;
    this.accordion = this.container.querySelector(selectors.accordion);
    this.accordionToggles = this.container.querySelectorAll(selectors.accordionToggle);
    this.accordionTogglesLength = this.accordionToggles.length;
    this.accordionBody = this.container.querySelector(selectors.accordionBody);

    if (this.accordionTogglesLength && this.accordionBody) {
      this.accordionEvents();
    }
  }

  accordionEvents() {
    this.accordionToggles.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const targetAccordionBody = element.parentElement.querySelector(selectors.accordionBody);
        if (targetAccordionBody && !targetAccordionBody.classList.contains(classes.sliding)) {
          this.onAccordionToggle(element, targetAccordionBody);
        }
      });
    });

    if (this.accordion.getAttribute(attributes.accordionExpandValue) === 'true') {
      this.accordionToggles[0].classList.add(classes.open);
      this.accordionToggles[0].ariaExpanded = 'true';

      showElement(this.accordionToggles[0].parentElement.querySelector(selectors.accordionBody));
    }
  }

  closeOtherAccordions(element, slide = true) {
    if (this.accordion.hasAttribute(attributes.accordionStopClose)) return;

    let otherElements = [...this.accordionToggles];
    const holder = this.container.closest(selectors.accordionHolder);
    if (holder) {
      otherElements = [...holder.querySelectorAll(selectors.accordionToggle)];
    }

    otherElements.filter((otherElement) => {
      const otherElementAccordionBody = otherElement.parentElement.querySelector(selectors.accordionBody);
      if (otherElement !== element && otherElement.classList.contains(classes.open) && otherElementAccordionBody) {
        this.onAccordionClose(otherElement, otherElementAccordionBody, slide);
      }
    });
  }

  onAccordionOpen(element, body, slide = true) {
    element.classList.add(classes.open);
    element.ariaExpanded = 'true';
    slideDown(body);

    this.closeOtherAccordions(element, slide);
  }

  onAccordionClose(element, body, slide = true) {
    element.classList.remove(classes.open);
    element.ariaExpanded = 'false';
    if (slide) {
      slideUp(body);
    } else {
      hideElement(body);
    }
  }

  onAccordionToggle(element, body) {
    element.classList.toggle(classes.open);
    element.ariaExpanded = element.classList.contains(classes.open) ? 'true' : 'false';

    slideToggle(body);

    this.closeOtherAccordions(element);

    element.dispatchEvent(
      new CustomEvent('theme:form:sticky', {
        bubbles: true,
        detail: {
          element: 'accordion',
        },
      })
    );
  }

  onBlockToggle(evt, blockSelect = true) {
    const targetAccordionToggle = this.container.querySelector(`${selectors.accordionToggle}[${attributes.accordionBlockValue}="${evt.detail.blockId}"]`);
    if (!targetAccordionToggle) return;
    const targetAccordionBody = targetAccordionToggle.parentElement.querySelector(selectors.accordionBody);
    if (!targetAccordionBody) return;
    if (blockSelect) {
      this.onAccordionOpen(targetAccordionToggle, targetAccordionBody, false);
    } else {
      this.onAccordionClose(targetAccordionToggle, targetAccordionBody);
    }
  }

  onSelectToggle(sectionSelect = true) {
    if (this.accordionBody && this.accordionTogglesLength && this.accordionTogglesLength < 2) {
      if (sectionSelect) {
        this.onAccordionOpen(this.accordionToggles[0], this.accordionBody, false);
      } else {
        this.onAccordionClose(this.accordionToggles[0], this.accordionBody);
      }
    }
  }

  onSelect() {
    this.onSelectToggle(true);
  }

  onDeselect() {
    this.onSelectToggle(false);
  }

  onBlockSelect(evt) {
    this.onBlockToggle(evt, true);
  }

  onBlockDeselect(evt) {
    this.onBlockToggle(evt, false);
  }
}

const accordions = {
  onLoad() {
    sections[this.id] = new GlobalAccordions(this);
  },
  onSelect() {
    sections[this.id].onSelect();
  },
  onDeselect() {
    sections[this.id].onDeselect();
  },
  onBlockSelect(e) {
    sections[this.id].onBlockSelect(e);
  },
  onBlockDeselect(e) {
    sections[this.id].onBlockDeselect(e);
  },
};

export default accordions;
