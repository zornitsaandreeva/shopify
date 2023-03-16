import debounce from '../util/debounce';

const selectors = {
  disclosureToggle: 'data-hover-disclosure-toggle',
  disclosureWrappper: '[data-hover-disclosure]',
  link: '[data-top-link]',
  wrapper: '[data-header-wrapper]',
  stagger: '[data-stagger]',
  staggerPair: '[data-stagger-first]',
  staggerAfter: '[data-stagger-second]',
  focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
};

const classes = {
  isVisible: 'is-visible',
  meganavVisible: 'meganav--visible',
  meganavIsTransitioning: 'meganav--is-transitioning',
};

let sections = {};
let disclosures = {};
class HoverDisclosure {
  constructor(el) {
    this.disclosure = el;
    this.wrapper = el.closest(selectors.wrapper);
    this.key = this.disclosure.id;
    this.trigger = document.querySelector(`[${selectors.disclosureToggle}='${this.key}']`);
    this.link = this.trigger.querySelector(selectors.link);
    this.grandparent = this.trigger.classList.contains('grandparent');
    this.transitionTimeout = 0;

    this.trigger.setAttribute('aria-haspopup', true);
    this.trigger.setAttribute('aria-expanded', false);
    this.trigger.setAttribute('aria-controls', this.key);

    this.connectHoverToggle();
    this.handleTablets();
    this.staggerChildAnimations();
  }

  onBlockSelect(evt) {
    if (this.disclosure.contains(evt.target)) {
      this.showDisclosure(evt);
    }
  }

  onBlockDeselect(evt) {
    if (this.disclosure.contains(evt.target)) {
      this.hideDisclosure();
    }
  }

  showDisclosure(e) {
    if (e && e.type && e.type === 'mouseenter') {
      this.wrapper.classList.add(classes.meganavIsTransitioning);
    }

    if (this.grandparent) {
      this.wrapper.classList.add(classes.meganavVisible);
    } else {
      this.wrapper.classList.remove(classes.meganavVisible);
    }
    this.trigger.setAttribute('aria-expanded', true);
    this.trigger.classList.add(classes.isVisible);
    this.disclosure.classList.add(classes.isVisible);

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    this.transitionTimeout = setTimeout(() => {
      this.wrapper.classList.remove(classes.meganavIsTransitioning);
    }, 200);
  }

  hideDisclosure() {
    this.disclosure.classList.remove(classes.isVisible);
    this.trigger.classList.remove(classes.isVisible);
    this.trigger.setAttribute('aria-expanded', false);
    this.wrapper.classList.remove(classes.meganavVisible, classes.meganavIsTransitioning);
  }

  staggerChildAnimations() {
    const simple = this.disclosure.querySelectorAll(selectors.stagger);
    simple.forEach((el, index) => {
      el.style.transitionDelay = `${index * 50 + 10}ms`;
    });

    const pairs = this.disclosure.querySelectorAll(selectors.staggerPair);
    pairs.forEach((child, i) => {
      const d1 = i * 100;
      child.style.transitionDelay = `${d1}ms`;
      child.parentElement.querySelectorAll(selectors.staggerAfter).forEach((grandchild, i2) => {
        const di1 = i2 + 1;
        const d2 = di1 * 20;
        grandchild.style.transitionDelay = `${d1 + d2}ms`;
      });
    });
  }

  handleTablets() {
    // first click opens the popup, second click opens the link
    this.trigger.addEventListener(
      'touchstart',
      function (e) {
        const isOpen = this.disclosure.classList.contains(classes.isVisible);
        if (!isOpen) {
          e.preventDefault();
          this.showDisclosure(e);
        }
      }.bind(this),
      {passive: true}
    );
  }

  connectHoverToggle() {
    this.trigger.addEventListener('mouseenter', (e) => this.showDisclosure(e));
    this.link.addEventListener('focus', (e) => this.showDisclosure(e));

    this.trigger.addEventListener('mouseleave', () => this.hideDisclosure());
    this.trigger.addEventListener('focusout', (e) => {
      const inMenu = this.trigger.contains(e.relatedTarget);
      if (!inMenu) {
        this.hideDisclosure();
      }
    });
    this.disclosure.addEventListener('keyup', (evt) => {
      if (evt.code !== window.theme.keyboardKeys.ESCAPE) {
        return;
      }
      this.hideDisclosure();
    });
  }
}

const hoverDisclosure = {
  onLoad() {
    sections[this.id] = [];
    disclosures = this.container.querySelectorAll(selectors.disclosureWrappper);
    disclosures.forEach((el) => {
      sections[this.id].push(new HoverDisclosure(el));
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
};

export default hoverDisclosure;
