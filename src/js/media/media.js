import Zoom from './zoom';
import Video from './video';

theme.mediaInstances = {};

const selectors = {
  videoPlayer: '[data-video]',
  modelViewer: '[data-model]',
  sliderEnabled: 'flickity-enabled',
};

const classes = {
  mediaHidden: 'media--hidden',
};

class Media {
  constructor(section) {
    this.section = section;
    this.id = section.id;
    this.container = section.container;
  }

  init() {
    this.detect3d();
    this.launch3d();

    new Video(this.section);
    new Zoom(this.section);
  }

  detect3d() {
    const modelViewerElements = this.container.querySelectorAll(selectors.modelViewer);
    if (modelViewerElements.length) {
      modelViewerElements.forEach((element) => {
        theme.ProductModel.init(element, this.id);
      });
    }
  }

  launch3d() {
    document.addEventListener('shopify_xr_launch', () => {
      const currentMedia = this.container.querySelector(`${selectors.modelViewer}:not(.${classes.mediaHidden})`);
      currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
    });
  }
}

export default Media;
