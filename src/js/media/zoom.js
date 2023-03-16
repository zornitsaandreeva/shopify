import {LoadPhotoswipe} from '../features/load-photoswipe';

const selectors = {
  zoomWrapper: '[data-zoom-wrapper]',
  dataImageSrc: 'data-image-src',
  dataImageWidth: 'data-image-width',
  dataImageHeight: 'data-image-height',
  dataImageAlt: 'data-image-alt',
  dataImageZoomEnable: 'data-image-zoom-enable',
  thumbs: '.pswp__thumbs',
  caption: '[data-zoom-caption]',
};

const classes = {
  variantSoldOut: 'variant--soldout',
  variantUnavailable: 'variant--unavailable',
  popupThumb: 'pswp__thumb',
  popupClass: 'pswp-zoom-gallery',
  popupClassNoThumbs: 'pswp-zoom-gallery--single',
  popupTitle: 'product__title',
  popupTitleNew: 'product__title pswp__title',
};

class Zoom {
  constructor(section) {
    this.container = section.container;
    this.zoomWrappers = this.container.querySelectorAll(selectors.zoomWrapper);
    this.thumbsContainer = document.querySelector(selectors.thumbs);
    this.zoomCaptionElem = this.container.querySelector(selectors.caption);
    this.zoomEnable = this.container.getAttribute(selectors.dataImageZoomEnable) === 'true';

    if (this.zoomEnable) {
      this.init();
    }
  }

  init() {
    if (this.zoomWrappers.length) {
      this.zoomWrappers.forEach((element, i) => {
        element.addEventListener('click', (e) => {
          e.preventDefault();

          this.createZoom(i);

          window.accessibility.lastElement = element;
        });

        element.addEventListener('keyup', (e) => {
          // On keypress Enter move the focus to the first focusable element in the related slide
          if (e.code === window.theme.keyboardKeys.ENTER) {
            e.preventDefault();

            this.createZoom(i);

            window.accessibility.lastElement = element;
          }
        });
      });
    }
  }

  createZoom(indexImage) {
    let items = [];
    let counter = 0;
    let thumbs = '';
    this.zoomWrappers.forEach((elementImage) => {
      const imgSrc = elementImage.getAttribute(selectors.dataImageSrc);
      const imgAlt = elementImage.hasAttribute(selectors.dataImageAlt) ? elementImage.getAttribute(selectors.dataImageAlt) : '';

      counter += 1;

      items.push({
        src: imgSrc,
        w: parseInt(elementImage.getAttribute(selectors.dataImageWidth)),
        h: parseInt(elementImage.getAttribute(selectors.dataImageHeight)),
        msrc: imgSrc,
      });

      thumbs += `<a href="#" class="${classes.popupThumb}" style="background-image: url('${imgSrc}')" aria-label="${imgAlt}" aria-current="false"></a>`;

      if (this.zoomWrappers.length === counter) {
        const options = {
          history: false,
          focus: false,
          index: indexImage,
          mainClass: counter === 1 ? `${classes.popupClass} ${classes.popupClassNoThumbs}` : `${classes.popupClass}`,
          showHideOpacity: true,
          howAnimationDuration: 150,
          hideAnimationDuration: 250,
          closeOnScroll: false,
          closeOnVerticalDrag: false,
          captionEl: true,
          closeEl: true,
          closeElClasses: ['caption-close', 'title'],
          tapToClose: false,
          clickToCloseNonZoomable: false,
          maxSpreadZoom: 2,
          loop: true,
          spacing: 0,
          allowPanToNext: true,
          pinchToClose: false,
          addCaptionHTMLFn: (item, captionEl, isFake) => {
            this.zoomCaption(item, captionEl, isFake);
          },
          getThumbBoundsFn: () => {
            const imageLocation = this.zoomWrappers[indexImage];
            const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            const rect = imageLocation.getBoundingClientRect();
            return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
          },
        };

        new LoadPhotoswipe(items, options);

        if (this.thumbsContainer && thumbs !== '') {
          this.thumbsContainer.innerHTML = thumbs;
        }
      }
    });
  }

  zoomCaption(item, captionEl) {
    let captionHtml = '';
    const targetContainer = captionEl.children[0];
    if (this.zoomCaptionElem) {
      captionHtml = this.zoomCaptionElem.innerHTML;

      if (this.zoomCaptionElem.closest(`.${classes.variantSoldOut}`)) {
        targetContainer.classList.add(classes.variantSoldOut);
      } else {
        targetContainer.classList.remove(classes.variantSoldOut);
      }

      if (this.zoomCaptionElem.closest(`.${classes.variantUnavailable}`)) {
        targetContainer.classList.add(classes.variantUnavailable);
      } else {
        targetContainer.classList.remove(classes.variantUnavailable);
      }
    }

    captionHtml = captionHtml.replaceAll(classes.popupTitle, classes.popupTitleNew);
    targetContainer.innerHTML = captionHtml;
    return false;
  }
}

export default Zoom;
