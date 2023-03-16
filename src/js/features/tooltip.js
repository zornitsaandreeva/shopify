import throttle from '../util/throttle';
import {getWindowWidth} from '../util/media-query';

const selectors = {
  tooltip: 'data-tooltip',
  tooltipStopMouseEnter: 'data-tooltip-stop-mouseenter',
};

const classes = {
  tooltipDefault: 'tooltip-default',
  visible: 'is-visible',
  hiding: 'is-hiding',
};

let sections = {};

export default class Tooltip {
  constructor(el, options = {}) {
    this.tooltip = el;
    if (!this.tooltip.hasAttribute(selectors.tooltip)) return;
    this.label = this.tooltip.getAttribute(selectors.tooltip);
    this.class = options.class || classes.tooltipDefault;
    this.transitionSpeed = options.transitionSpeed || 200;
    this.hideTransitionTimeout = 0;
    this.addPinEvent = () => this.addPin();
    this.addPinMouseEvent = () => this.addPin(true);
    this.removePinEvent = (event) => throttle(this.removePin(event), 50);
    this.removePinMouseEvent = (event) => this.removePin(event, true, true);
    this.init();
  }

  init() {
    if (!document.querySelector(`.${this.class}`)) {
      const tooltipTemplate = `<div class="${this.class}__arrow"></div><div class="${this.class}__inner"><div class="${this.class}__text"></div></div>`;
      const tooltipElement = document.createElement('div');
      tooltipElement.className = this.class;
      tooltipElement.innerHTML = tooltipTemplate;
      document.body.appendChild(tooltipElement);
    }

    this.tooltip.addEventListener('mouseenter', this.addPinMouseEvent);
    this.tooltip.addEventListener('mouseleave', this.removePinMouseEvent);
    this.tooltip.addEventListener('theme:tooltip:init', this.addPinEvent);
    document.addEventListener('theme:tooltip:close', this.removePinEvent);
  }

  addPin(stopMouseEnter = false) {
    const tooltipTarget = document.querySelector(`.${this.class}`);

    if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(selectors.tooltipStopMouseEnter)) || !stopMouseEnter)) {
      const tooltipTargetArrow = tooltipTarget.querySelector(`.${this.class}__arrow`);
      const tooltipTargetInner = tooltipTarget.querySelector(`.${this.class}__inner`);
      const tooltipTargetText = tooltipTarget.querySelector(`.${this.class}__text`);
      tooltipTargetText.textContent = this.label;

      const tooltipTargetWidth = tooltipTargetInner.offsetWidth;
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const tooltipTop = tooltipRect.top;
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height;
      const tooltipTargetPositionTop = tooltipTop + tooltipHeight + window.scrollY;
      let tooltipTargetPositionLeft = tooltipRect.left - tooltipTargetWidth / 2 + tooltipWidth / 2;
      const tooltipLeftWithWidth = tooltipTargetPositionLeft + tooltipTargetWidth;
      const tooltipTargetWindowDifference = tooltipLeftWithWidth - getWindowWidth();

      if (tooltipTargetWindowDifference > 0) {
        tooltipTargetPositionLeft -= tooltipTargetWindowDifference;
      }

      if (tooltipTargetPositionLeft < 0) {
        tooltipTargetPositionLeft = 0;
      }

      tooltipTargetArrow.style.left = `${tooltipRect.left + tooltipWidth / 2}px`;
      tooltipTarget.style.setProperty('--tooltip-top', `${tooltipTargetPositionTop}px`);
      tooltipTargetInner.style.transform = `translateX(${tooltipTargetPositionLeft}px)`;
      tooltipTarget.classList.remove(classes.hiding);
      tooltipTarget.classList.add(classes.visible);

      document.addEventListener('theme:scroll', this.removePinEvent);
    }
  }

  removePin(event, stopMouseEnter = false, hideTransition = false) {
    const tooltipTarget = document.querySelector(`.${this.class}`);
    const tooltipVisible = tooltipTarget.classList.contains(classes.visible);

    if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(selectors.tooltipStopMouseEnter)) || !stopMouseEnter)) {
      if (tooltipVisible && (hideTransition || event.detail.hideTransition)) {
        tooltipTarget.classList.add(classes.hiding);

        if (this.hideTransitionTimeout) {
          clearTimeout(this.hideTransitionTimeout);
        }

        this.hideTransitionTimeout = setTimeout(() => {
          tooltipTarget.classList.remove(classes.hiding);
        }, this.transitionSpeed);
      }

      tooltipTarget.classList.remove(classes.visible);

      document.removeEventListener('theme:scroll', this.removePinEvent);
    }
  }

  unload() {
    this.tooltip.removeEventListener('mouseenter', this.addPinMouseEvent);
    this.tooltip.removeEventListener('mouseleave', this.removePinMouseEvent);
    this.tooltip.removeEventListener('theme:tooltip:init', this.addPinEvent);
    document.removeEventListener('theme:tooltip:close', this.removePinEvent);
    document.removeEventListener('theme:scroll', this.removePinEvent);
  }
}

export const tooltipSection = {
  onLoad() {
    sections[this.id] = [];
    const els = this.container.querySelectorAll(`[${selectors.tooltip}]`);
    els.forEach((el) => {
      sections[this.id].push(new Tooltip(el));
    });
  },
  onUnload: function () {
    sections[this.id].forEach((el) => {
      if (typeof el.unload === 'function') {
        el.unload();
      }
    });
  },
};
