function debounce(fn, time) {
  let timeout;
  return function () {
    // eslint-disable-next-line prefer-rest-params
    if (fn) {
      const functionCall = () => fn.apply(this, arguments);
      clearTimeout(timeout);
      timeout = setTimeout(functionCall, time);
    }
  };
}

export default debounce;
