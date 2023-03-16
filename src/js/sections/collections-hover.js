import {register} from '../vendor/theme-scripts/theme-sections';
import scrollSpy from '../features/scroll-spy';
import {isDesktop} from '../util/media-query';

const selectors = {
  button: '[data-hover-target]',
  image: '[data-collection-image]',
};

const attributes = {
  target: 'data-hover-target',
};

const classes = {
  visible: 'is-visible',
  selected: 'is-selected',
};

let sections = {};

class CollectionsHover {
  constructor(section) {
    this.container = section.container;
    this.buttons = this.container.querySelectorAll(selectors.button);

    this.init();
  }

  init() {
    if (this.buttons.length) {
      this.buttons.forEach((button) => {
        button.addEventListener('mouseenter', (e) => {
          const targetId = e.currentTarget.getAttribute(attributes.target);

          this.updateState(targetId);
        });
      });
    }
  }

  updateState(targetId) {
    const button = this.container.querySelector(`[${attributes.target}="${targetId}"]`);
    const target = this.container.querySelector(`#${targetId}:not(.${classes.visible})`);
    const buttonSelected = this.container.querySelector(`${selectors.button}.${classes.selected}`);
    const imageVisible = this.container.querySelector(`${selectors.image}.${classes.visible}`);

    if (target && isDesktop()) {
      imageVisible?.classList.remove(classes.visible);
      buttonSelected?.classList.remove(classes.selected);

      target.classList.add(classes.visible);
      button.classList.add(classes.selected);
    }
  }

  onBlockSelect(e) {
    this.updateState(e.target.id);
  }
}

const collectionsHover = {
  onLoad() {
    sections[this.id] = new CollectionsHover(this);
  },
  onBlockSelect(e) {
    sections[this.id].onBlockSelect(e);
  },
};

register('collections-hover', [collectionsHover, scrollSpy]);
