import Rellax from 'rellax';

var sections = {};

const parallaxHero = {
  onLoad() {
    sections[this.id] = [];
    const frames = this.container.querySelectorAll('[data-parallax-wrapper]');
    frames.forEach((frame) => {
      const inner = frame.querySelector('[data-parallax-img]');

      sections[this.id].push(
        new Rellax(inner, {
          center: true,
          round: true,
          frame: frame,
        })
      );
    });

    window.addEventListener('load', () => {
      sections[this.id].forEach((image) => {
        if (typeof image.refresh === 'function') {
          image.refresh();
        }
      });
    });
  },
  onUnload: function () {
    sections[this.id].forEach((image) => {
      if (typeof image.destroy === 'function') {
        image.destroy();
      }
    });
  },
};

export default parallaxHero;
