import slideDown from './slide-down';
import slideUp from './slide-up';

const slideToggle = (target, duration = 500, showDisplay = 'block') => {
  if (window.getComputedStyle(target).display === 'none') {
    return slideDown(target, duration, showDisplay);
  } else {
    return slideUp(target, duration);
  }
};

export default slideToggle;
