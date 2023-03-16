function getWindowWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

function getWindowHeight() {
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

function isDesktop() {
  return getWindowWidth() >= window.theme.sizes.small;
}

function isMobile() {
  return getWindowWidth() < window.theme.sizes.small;
}

export {getWindowWidth, getWindowHeight, isMobile, isDesktop};
