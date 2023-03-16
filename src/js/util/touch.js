function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

export default function isTouch() {
  if (isTouchDevice()) {
    document.documentElement.className = document.documentElement.className.replace('no-touch', 'supports-touch');
    window.theme.touch = true;
  } else {
    window.theme.touch = false;
  }
}
