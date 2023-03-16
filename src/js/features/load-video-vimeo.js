const sections = {};

const selectors = {
  dataEnableSound: 'data-enable-sound',
  dataEnableBackground: 'data-enable-background',
  dataEnableAutoplay: 'data-enable-autoplay',
  dataEnableLoop: 'data-enable-loop',
  dataVideoId: 'data-video-id',
  dataVideoType: 'data-video-type',
  videoIframe: '[data-video-id]',
};

const classes = {
  loaded: 'loaded',
};

class LoadVideoVimeo {
  constructor(container) {
    this.container = container;
    this.player = this.container.querySelector(selectors.videoIframe);

    if (this.player) {
      this.videoID = this.player.getAttribute(selectors.dataVideoId);
      this.videoType = this.player.getAttribute(selectors.dataVideoType);
      this.enableBackground = this.player.getAttribute(selectors.dataEnableBackground) === 'true';
      this.disableSound = this.player.getAttribute(selectors.dataEnableSound) === 'false';
      this.enableAutoplay = this.player.getAttribute(selectors.dataEnableAutoplay) !== 'false';
      this.enableLoop = this.player.getAttribute(selectors.dataEnableLoop) !== 'false';

      if (this.videoType == 'vimeo') {
        this.init();
      }
    }
  }

  init() {
    this.loadVimeoPlayer();
  }

  loadVimeoPlayer() {
    const oembedUrl = 'https://vimeo.com/api/oembed.json';
    const vimeoUrl = 'https://vimeo.com/' + this.videoID;
    let paramsString = '';
    const state = this.player;

    const params = {
      url: vimeoUrl,
      background: this.enableBackground,
      muted: this.disableSound,
      autoplay: this.enableAutoplay,
      loop: this.enableLoop,
    };

    for (let key in params) {
      paramsString += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
    }

    fetch(`${oembedUrl}?${paramsString}`)
      .then((response) => response.json())
      .then(function (data) {
        state.innerHTML = data.html;

        setTimeout(function () {
          state.parentElement.classList.add(classes.loaded);
        }, 1000);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

const loadVideoVimeo = {
  onLoad() {
    sections[this.id] = new LoadVideoVimeo(this.container);
  },
};

export {loadVideoVimeo, LoadVideoVimeo};
