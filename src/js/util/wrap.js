const wrap = (toWrap, wrapperClass = '', wrapperOption) => {
  const wrapper = wrapperOption || document.createElement('div');
  wrapper.classList.add(wrapperClass);
  toWrap.parentNode.insertBefore(wrapper, toWrap);
  return wrapper.appendChild(toWrap);
};

export default wrap;
