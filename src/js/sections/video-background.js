const selectors = {
  videoId: '[data-video-id]',
  videoPlayer: '[data-video-player]',
  videoTemplate: '[data-video-template]',
};

const classes = {
  loading: 'is-loading',
};

const sections = {};

/**
 * Video section constructor.
 * @param {string} container - selector for the section container DOM element
 */
class VideoBackground {
  constructor(section) {
    this.container = section.container;
    this.videoId = this.container.querySelector(selectors.videoId);
    this.videoPlayer = this.container.querySelector(selectors.videoPlayer);
    this.videoTemplate = this.container.querySelector(selectors.videoTemplate);
    this.video = null;
    this.init();
  }

  init() {
    if (this.videoId) {
      // Force video autoplay on iOS when Low Power Mode is On
      this.container.addEventListener(
        'touchstart',
        () => {
          this.video?.play();
        },
        {passive: true}
      );

      this.renderVideo();
    }
  }

  renderVideo() {
    /*
      Observe video element and pull it out from its template tag
    */
    this.videoTemplateObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const content = this.videoTemplate.innerHTML;

            this.videoPlayer.innerHTML = content;
            this.videoPlayer.classList.remove(classes.loading);
            this.video = this.container.querySelector('video');
            this.observeVideoPlayToggle();

            // Stop observing element after it was animated
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    this.videoTemplateObserver.observe(this.videoPlayer);
  }

  observeVideoPlayToggle() {
    if (!this.video) return;

    const options = {
      rootMargin: '0px',
      threshold: [0, 1.0],
    };

    this.videoPlayObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting;
        if (isVisible && typeof this.video.play === 'function') {
          this.video.play();
        }
        if (!isVisible && typeof this.video.pause === 'function') {
          this.video.pause();
        }
      });
    }, options);

    this.videoPlayObserver.observe(this.video);
  }

  onUnload() {
    if (this.videoTemplateObserver) {
      this.videoTemplateObserver.disconnect();
    }

    if (this.videoPlayObserver) {
      this.videoPlayObserver.disconnect();
    }
  }
}

const videoBackground = {
  onLoad() {
    sections[this.id] = new VideoBackground(this);
  },
  onUnload() {
    sections[this.id].onUnload();
  },
};

export {videoBackground, VideoBackground};
