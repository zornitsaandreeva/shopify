import debounce from '../util/debounce';
import {getWindowHeight, getWindowWidth} from '../util/media-query';

let lastWindowWidth = getWindowWidth();
let lastWindowHeight = getWindowHeight();

function dispatch() {
  document.dispatchEvent(
    new CustomEvent('theme:resize', {
      bubbles: true,
    })
  );

  if (lastWindowWidth !== getWindowWidth()) {
    document.dispatchEvent(
      new CustomEvent('theme:resize:width', {
        bubbles: true,
      })
    );

    lastWindowWidth = getWindowWidth();
  }

  if (lastWindowHeight !== getWindowHeight()) {
    document.dispatchEvent(
      new CustomEvent('theme:resize:height', {
        bubbles: true,
      })
    );

    lastWindowHeight = getWindowHeight();
  }
}

function resizeListener() {
  window.addEventListener(
    'resize',
    debounce(function () {
      dispatch();
    }, 50)
  );
}

export default resizeListener;
