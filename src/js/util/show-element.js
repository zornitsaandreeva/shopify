const showElement = (elem, removeProp = false, prop = 'block') => {
  if (elem) {
    if (removeProp) {
      elem.style.removeProperty('display');
    } else {
      elem.style.display = prop;
    }
  }
};

export default showElement;
