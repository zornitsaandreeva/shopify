const fadeOut = (el, callback = null) => {
  el.style.opacity = 1;

  (function fade() {
    if ((el.style.opacity -= 0.1) < 0) {
      el.style.display = 'none';
    } else {
      requestAnimationFrame(fade);
    }

    if (parseFloat(el.style.opacity) === 0 && typeof callback === 'function') {
      callback();
    }
  })();
};

export default fadeOut;