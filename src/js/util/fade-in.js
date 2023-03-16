const fadeIn = (el, display, callback = null) => {
  el.style.opacity = 0;
  el.style.display = display || 'block';
  let flag = true;

  (function fade() {
    let val = parseFloat(el.style.opacity);
    if (!((val += 0.1) > 1)) {
      el.style.opacity = val;
      requestAnimationFrame(fade);
    }

    if (parseInt(val) === 1 && flag && typeof callback === 'function') {
      flag = false;
      callback();
    }
  })();
};

export default fadeIn;
