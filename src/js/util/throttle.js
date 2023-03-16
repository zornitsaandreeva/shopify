const throttle = (fn, wait) => {
  let prev, next;
  return function invokeFn(...args) {
    const now = Date.now();
    next = clearTimeout(next);
    if (!prev || now - prev >= wait) {
      // eslint-disable-next-line prefer-spread
      fn.apply(null, args);
      prev = now;
    } else {
      next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
    }
  };
};

export default throttle;
