const selectors = {
  headerSticky: '[data-header-sticky]',
  headerHeight: '[data-header-height]',
};

const scrollTo = (elementTop) => {
  /* Sticky header check */
  const headerHeight =
    document.querySelector(selectors.headerSticky) && document.querySelector(selectors.headerHeight) ? document.querySelector(selectors.headerHeight).getBoundingClientRect().height : 0;

  window.scrollTo({
    top: elementTop + window.scrollY - headerHeight,
    left: 0,
    behavior: 'smooth',
  });
};

export default scrollTo;
