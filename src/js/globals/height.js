let screenOrientation = getScreenOrientation();
window.initialWindowHeight = Math.min(window.screen.height, window.innerHeight);

function readHeights() {
  const h = {};
  h.windowHeight = Math.min(window.screen.height, window.innerHeight);
  h.announcementHeight = getHeight('[data-section-type*="announcement"] [data-bar-top]');
  h.footerHeight = getHeight('[data-section-type*="footer"]');
  h.menuHeight = getHeight('[data-header-height]');
  h.headerHeight = h.menuHeight + h.announcementHeight;
  h.collectionNavHeight = getHeight('[data-collection-nav]');
  h.logoHeight = getFooterLogoWithPadding();

  return h;
}

function setVarsOnResize() {
  document.addEventListener('theme:resize', resizeVars);
  setVars();
}

function setVars() {
  const {windowHeight, announcementHeight, headerHeight, logoHeight, menuHeight, footerHeight, collectionNavHeight} = readHeights();

  document.documentElement.style.setProperty('--full-screen', `${windowHeight}px`);
  document.documentElement.style.setProperty('--three-quarters', `${windowHeight * (3 / 4)}px`);
  document.documentElement.style.setProperty('--two-thirds', `${windowHeight * (2 / 3)}px`);
  document.documentElement.style.setProperty('--one-half', `${windowHeight / 2}px`);
  document.documentElement.style.setProperty('--one-third', `${windowHeight / 3}px`);

  document.documentElement.style.setProperty('--menu-height', `${menuHeight}px`);
  document.documentElement.style.setProperty('--announcement-height', `${announcementHeight}px`);
  document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--collection-nav-height', `${collectionNavHeight}px`);

  document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
  document.documentElement.style.setProperty('--content-full', `${windowHeight - headerHeight - logoHeight / 2}px`);
  document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);

  if (document.querySelector('[data-tracking-consent].popup-cookies--bottom')) {
    document.documentElement.style.setProperty('--cookie-bar-height', `${document.querySelector('[data-tracking-consent].popup-cookies--bottom').offsetHeight}px`);
  }

  document.documentElement.style.setProperty('--scrollbar-width', `${getScrollbarWidth()}px`);
}

function resizeVars() {
  // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
  const {windowHeight, announcementHeight, headerHeight, logoHeight, menuHeight, footerHeight, collectionNavHeight} = readHeights();
  const currentScreenOrientation = getScreenOrientation();

  if (currentScreenOrientation !== screenOrientation) {
    // Only update the heights on screen orientation change
    document.documentElement.style.setProperty('--full-screen', `${windowHeight}px`);
    document.documentElement.style.setProperty('--three-quarters', `${windowHeight * (3 / 4)}px`);
    document.documentElement.style.setProperty('--two-thirds', `${windowHeight * (2 / 3)}px`);
    document.documentElement.style.setProperty('--one-half', `${windowHeight / 2}px`);
    document.documentElement.style.setProperty('--one-third', `${windowHeight / 3}px`);

    // Update the screen orientation state
    screenOrientation = currentScreenOrientation;
  }

  document.documentElement.style.setProperty('--menu-height', `${menuHeight}px`);
  document.documentElement.style.setProperty('--announcement-height', `${announcementHeight}px`);
  document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--collection-nav-height', `${collectionNavHeight}px`);

  document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
  document.documentElement.style.setProperty('--content-full', `${windowHeight - headerHeight - logoHeight / 2}px`);
  document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);

  if (document.querySelector('[data-tracking-consent].popup-cookies--bottom')) {
    document.documentElement.style.setProperty('--cookie-bar-height', `${document.querySelector('[data-tracking-consent].popup-cookies--bottom').offsetHeight}px`);
  }
}

function getScreenOrientation() {
  if (window.matchMedia('(orientation: portrait)').matches) {
    return 'portrait';
  }

  if (window.matchMedia('(orientation: landscape)').matches) {
    return 'landscape';
  }
}

function getHeight(selector) {
  const el = document.querySelector(selector);
  if (el) {
    return el.offsetHeight;
  } else {
    return 0;
  }
}

function getFooterLogoWithPadding() {
  const height = getHeight('[data-footer-logo]');
  if (height > 0) {
    return height + 20;
  } else {
    return 0;
  }
}

function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);

  return scrollbarWidth;
}

export {setVarsOnResize, setVars, readHeights, getScreenOrientation};
