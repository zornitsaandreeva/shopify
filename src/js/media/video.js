import loadScript from '../util/loader';

const hosts = {
  html5: 'html5',
  youtube: 'youtube',
  vimeo: 'vimeo',
};

const selectors = {
  deferredMedia: '[data-deferred-media]',
  deferredMediaButton: '[data-deferred-media-button]',
  productMediaWrapper: '[data-product-single-media-wrapper]',
  productMediaSlider: '[data-product-single-media-slider]',
  mediaContainer: '[data-video]',
  mediaId: 'data-media-id',
  dataTallLayout: 'data-tall-layout',
};

const classes = {
  mediaHidden: 'media--hidden',
};

theme.mediaInstances = {};
class Video {
  constructor(section) {
    this.section = section;
    this.container = section.container;
    this.id = section.id;
    this.tallLayout = this.container.getAttribute(selectors.dataTallLayout) === 'true';
    this.players = {};
    this.init();
  }

  init() {
    const mediaContainers = this.container.querySelectorAll(selectors.mediaContainer);

    mediaContainers.forEach((mediaContainer) => {
      const deferredMediaButton = mediaContainer.querySelector(selectors.deferredMediaButton);

      if (deferredMediaButton) {
        deferredMediaButton.addEventListener('click', this.loadContent.bind(this, mediaContainer));
      }
    });
  }

  loadContent(mediaContainer) {
    if (mediaContainer.querySelector(selectors.deferredMedia).getAttribute('loaded')) {
      return;
    }

    const content = document.createElement('div');
    content.appendChild(mediaContainer.querySelector('template').content.firstElementChild.cloneNode(true));
    const mediaId = mediaContainer.dataset.mediaId;
    const element = content.querySelector('video, iframe');
    const host = this.hostFromVideoElement(element);
    const deferredMedia = mediaContainer.querySelector(selectors.deferredMedia);
    deferredMedia.appendChild(element).focus();
    deferredMedia.setAttribute('loaded', true);

    this.players[mediaId] = {
      mediaId: mediaId,
      sectionId: this.id,
      container: mediaContainer,
      element: element,
      host: host,
      ready: () => this.createPlayer(mediaId),
    };

    const video = this.players[mediaId];

    switch (video.host) {
      case hosts.html5:
        this.loadVideo(video, hosts.html5);
        break;
      case hosts.vimeo:
        if (window.isVimeoAPILoaded) {
          this.loadVideo(video, hosts.vimeo);
        } else {
          loadScript({url: 'https://player.vimeo.com/api/player.js'}).then(() => this.loadVideo(video, hosts.vimeo));
        }
        break;
      case hosts.youtube:
        if (window.isYoutubeAPILoaded) {
          this.loadVideo(video, hosts.youtube);
        } else {
          loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadVideo(video, hosts.youtube));
        }
        break;
    }
  }

  hostFromVideoElement(video) {
    if (video.tagName === 'VIDEO') {
      return hosts.html5;
    }

    if (video.tagName === 'IFRAME') {
      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(video.src)) {
        return hosts.youtube;
      } else if (video.src.includes('vimeo.com')) {
        return hosts.vimeo;
      }
    }

    return null;
  }

  loadVideo(video, host) {
    if (video.host === host) {
      video.ready();
    }
  }

  createPlayer(mediaId) {
    const video = this.players[mediaId];

    switch (video.host) {
      case hosts.html5:
        // Force video play on iOS
        video.element.play();
        video.element.addEventListener('play', () => this.pauseOtherMedia(mediaId));

        video.element.play(); // Force video play on iOS
        video.container.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
        video.container.addEventListener('xrLaunch', (event) => this.onHidden(event));
        video.container.addEventListener('theme:media:visible', (event) => this.onVisible(event));

        if (this.tallLayout) {
          this.observeVideo(video, mediaId);
        }

        break;
      case hosts.vimeo:
        this.players[mediaId].player = new Vimeo.Player(video.element);
        this.players[mediaId].player.play(); // Force video play on iOS

        window.isVimeoAPILoaded = true;

        video.container.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
        video.container.addEventListener('xrLaunch', (event) => this.onHidden(event));
        video.container.addEventListener('theme:media:visible', (event) => this.onVisible(event));

        if (this.tallLayout) {
          this.observeVideo(video, mediaId);
        }

        break;
      case hosts.youtube:
        if (video.host == hosts.youtube && video.player) {
          return;
        }

        YT.ready(() => {
          const videoId = video.container.dataset.videoId;

          this.players[mediaId].player = new YT.Player(video.element, {
            videoId: videoId,
            events: {
              onReady: (event) => event.target.playVideo(), // Force video play on iOS
            },
          });

          window.isYoutubeAPILoaded = true;

          video.container.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
          video.container.addEventListener('xrLaunch', (event) => this.onHidden(event));
          video.container.addEventListener('theme:media:visible', (event) => this.onVisible(event));

          if (this.tallLayout) {
            this.observeVideo(video, mediaId);
          }
        });

        break;
    }
  }

  observeVideo(video, mediaId) {
    let observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          const outsideViewport = entry.intersectionRatio != 1;

          if (outsideViewport) {
            this.pauseVideo(video);
          } else {
            this.playVideo(video);
            this.pauseOtherMedia(mediaId);
          }
        });
      },
      {threshold: 1}
    );
    observer.observe(video.element);
  }

  playVideo(video) {
    if (video.player && video.player.playVideo) {
      video.player.playVideo();
    } else if (video.element && video.element.play) {
      video.element.play();
    } else if (video.player && video.player.play) {
      video.player.play();
    }
  }

  pauseVideo(video) {
    if (video.player && video.player.pauseVideo) {
      video.player.pauseVideo();
    } else if (video.element && video.element.pause) {
      video.element.pause();
    } else if (video.player && video.player.pause) {
      video.player.pause();
    }
  }

  onHidden(event) {
    if (typeof event.target.dataset.mediaId !== 'undefined') {
      this.pauseVideo(this.players[event.target.dataset.mediaId]);
    }
  }

  onVisible(event) {
    if (typeof event.target.dataset.mediaId !== 'undefined') {
      this.playVideo(this.players[event.target.dataset.mediaId]);
    }
  }

  pauseOtherMedia(mediaId) {
    const mediaIdString = `[${selectors.mediaId}="${mediaId}"]`;
    const otherMedia = document.querySelectorAll(`${selectors.productMediaWrapper}:not(${mediaIdString})`);

    document.querySelector(`${selectors.productMediaWrapper}${mediaIdString}`).classList.remove(classes.mediaHidden);

    if (otherMedia.length) {
      otherMedia.forEach((element) => {
        element.dispatchEvent(new CustomEvent('theme:media:hidden'));
        element.classList.add(classes.mediaHidden);
      });
    }
  }
}
export default Video;
