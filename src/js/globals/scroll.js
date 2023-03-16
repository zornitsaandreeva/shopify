import {disableBodyScroll, clearAllBodyScrollLocks} from 'body-scroll-lock';

let prev = window.pageYOffset;
let up = null;
let down = null;
let wasUp = null;
let wasDown = null;
let scrollLockTimeout = 0;
let scrollPosition = 0;
let targetElement = null;

function dispatch() {
  const position = window.pageYOffset;
  if (position > prev) {
    down = true;
    up = false;
  } else if (position < prev) {
    down = false;
    up = true;
  } else {
    up = null;
    down = null;
  }
  prev = position;
  document.dispatchEvent(
    new CustomEvent('theme:scroll', {
      detail: {
        up,
        down,
        position,
      },
      bubbles: false,
    })
  );
  if (up && !wasUp) {
    document.dispatchEvent(
      new CustomEvent('theme:scroll:up', {
        detail: {position},
        bubbles: false,
      })
    );
  }
  if (down && !wasDown) {
    document.dispatchEvent(
      new CustomEvent('theme:scroll:down', {
        detail: {position},
        bubbles: false,
      })
    );
  }
  wasDown = down;
  wasUp = up;
}

function lock(e) {
  targetElement = e.detail;

  disableBodyScroll(targetElement, {
    allowTouchMove: (el) => {
      while (el && el !== document.body) {
        if (el.getAttribute('body-scroll-lock-ignore') !== null || el.getAttribute('data-popout-list') !== null || el.tagName === 'TEXTAREA') {
          return true;
        }

        el = el.parentElement;
      }
    },
  });

  // Don't change scroll position if page scroll is already locked
  if (document.documentElement.hasAttribute('data-scroll-locked')) return;

  scrollPosition = window.scrollY;
  document.documentElement.style.setProperty('scroll-behavior', 'auto');
  requestAnimationFrame(() => {
    document.documentElement.setAttribute('data-scroll-locked', '');
    document.body.style.setProperty('--scroll-top-position', `-${scrollPosition}px`);
    document.documentElement.style.removeProperty('scroll-behavior');
  });
}

function unlock() {
  // Prevent body scroll lock race conditions
  scrollLockTimeout = setTimeout(() => {
    document.body.removeAttribute('data-drawer-closing');
  }, 20);

  if (document.body.hasAttribute('data-drawer-closing')) {
    document.body.removeAttribute('data-drawer-closing');

    if (scrollLockTimeout) {
      clearTimeout(scrollLockTimeout);
    }

    return;
  } else {
    document.body.setAttribute('data-drawer-closing', '');
  }

  clearAllBodyScrollLocks();

  document.documentElement.removeAttribute('data-scroll-locked');
  document.documentElement.style.setProperty('scroll-behavior', 'auto');

  window.scrollTo({
    top: scrollPosition,
    behavior: 'auto',
  });
  document.documentElement.style.removeProperty('scroll-behavior');
}

function scrollListener() {
  let timeout;
  window.addEventListener(
    'scroll',
    function () {
      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }
      timeout = window.requestAnimationFrame(function () {
        dispatch();
      });
    },
    {passive: true}
  );

  window.addEventListener('theme:scroll:lock', lock);
  window.addEventListener('theme:scroll:unlock', unlock);
}

export default scrollListener;
