import {LoadPhotoswipe} from './load-photoswipe';

const selectors = {
  videoPlay: '[data-video-play]',
  videoPlayValue: 'data-video-play',
};

class VideoPlay {
  constructor(section, selector = selectors.videoPlay, selectorValue = selectors.videoPlayValue) {
    this.container = section;
    this.videoPlay = this.container.querySelectorAll(selector);

    if (this.videoPlay.length) {
      this.videoPlay.forEach((element) => {
        element.addEventListener('click', (e) => {
          const button = e.currentTarget;
          if (button.hasAttribute(selectorValue) && button.getAttribute(selectorValue).trim() !== '') {
            e.preventDefault();

            const items = [
              {
                html: button.getAttribute(selectorValue),
              },
            ];

            new LoadPhotoswipe(items);
            window.accessibility.lastElement = button;
          }
        });
      });
    }
  }
}

const videoPlay = {
  onLoad() {
    new VideoPlay(this.container);
  },
};

export {videoPlay, VideoPlay};
