import floatLabels from '../globals/forms';
import {setVarsOnResize, setVars} from '../globals/height';
import preloadImages from '../globals/preload-images';
import resizeListener from '../globals/resize';
import scrollListener from '../globals/scroll';
import wrapElements from '../globals/wrap';
import isTouch from '../util/touch';
import {ariaToggle} from '../globals/aria-toggle';
import {loading} from '../globals/loading';
import {loadedImagesEventHook, removeLoadingClassFromLoadedImages} from '../globals/images';
import PredictiveSearch from '../globals/predictive-search';
import {initAnimations} from '../globals/animations';

// Safari requestIdleCallback polyfill
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

if (window.theme.settings.enableAnimations) {
  initAnimations();
}

resizeListener();
scrollListener();
isTouch();
setVars();
loadedImagesEventHook();

window.addEventListener('DOMContentLoaded', () => {
  setVarsOnResize();
  ariaToggle(document);
  floatLabels(document);
  wrapElements(document);
  removeLoadingClassFromLoadedImages(document);
  loading();

  if (window.fastNetworkAndCPU) {
    preloadImages();
  }
});

document.addEventListener('shopify:section:load', (e) => {
  const container = e.target;
  floatLabels(container);
  wrapElements(container);
  ariaToggle(document);
  setVarsOnResize();
});
