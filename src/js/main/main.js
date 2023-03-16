import {load} from '../vendor/theme-scripts/theme-sections';
import loadScript from '../util/loader';

document.addEventListener('DOMContentLoaded', function () {
  // Load all registered sections on the page.
  load('*');

  // Scroll to top button
  const scrollTopButton = document.querySelector('[data-scroll-top-button]');
  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    });
    document.addEventListener('theme:scroll', () => {
      scrollTopButton.classList.toggle('is-visible', window.pageYOffset > window.innerHeight);
    });
  }

  if (window.self !== window.top) {
    document.querySelector('html').classList.add('iframe');
  }

  // Safari smoothscroll polyfill
  let hasNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;
  if (!hasNativeSmoothScroll) {
    loadScript({url: window.theme.assets.smoothscroll});
  }
});

// Apply a specific class to the html element for browser support of cookies.
if (window.navigator.cookieEnabled) {
  document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');
}
