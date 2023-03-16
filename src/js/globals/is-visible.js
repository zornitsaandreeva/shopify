function isVisible(el) {
  var style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

export default isVisible;
