const classes = {
  sliding: 'is-sliding',
};

const slideDown = (target, duration = 500, showDisplay = 'block', checkHidden = true) => {
  let display = window.getComputedStyle(target).display;
  if ((checkHidden && display !== 'none') || target.classList.contains(classes.sliding)) return;
  target.style.removeProperty('display');
  if (display === 'none') display = showDisplay;
  target.classList.add(classes.sliding);
  target.style.display = display;
  let height = target.offsetHeight;
  target.style.overflow = 'hidden';
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.offsetHeight;
  target.style.boxSizing = 'border-box';
  target.style.transitionProperty = 'height, margin, padding';
  target.style.transitionDuration = duration + 'ms';
  target.style.height = height + 'px';
  target.style.removeProperty('padding-top');
  target.style.removeProperty('padding-bottom');
  target.style.removeProperty('margin-top');
  target.style.removeProperty('margin-bottom');
  window.setTimeout(() => {
    target.style.removeProperty('height');
    target.style.removeProperty('overflow');
    target.style.removeProperty('transition-duration');
    target.style.removeProperty('transition-property');
    target.classList.remove(classes.sliding);
  }, duration);
};

export default slideDown;
