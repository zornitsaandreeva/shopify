const selectors = {
  aos: '[data-aos]:not(.aos-animate)',
  aosAnchor: '[data-aos-anchor]',
};

const classes = {
  aosAnimate: 'aos-animate',
};

const observerConfig = {
  attributes: false,
  childList: true,
  subtree: true,
};

const mutationCallback = (mutationList) => {
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      const element = mutation.target;
      const elementsToAnimate = element.querySelectorAll(selectors.aos);
      const anchors = element.querySelectorAll(selectors.aosAnchor);

      if (elementsToAnimate.length) {
        elementsToAnimate.forEach((element) => {
          aosItemObserver.observe(element);
        });
      }

      if (anchors.length) {
        // Get all anchors and attach observers
        initAnchorObservers(anchors);
      }
    }
  }
};

/*
  Observe each element that needs to be animated
*/
const aosItemObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(classes.aosAnimate);

        // Stop observing element after it was animated
        observer.unobserve(entry.target);
      }
    });
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
  }
);

/*
  Observe anchor elements
*/
const aosAnchorObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0.1) {
        const elementsToAnimate = entry.target.querySelectorAll(selectors.aos);

        if (elementsToAnimate.length) {
          elementsToAnimate.forEach((item) => {
            item.classList.add(classes.aosAnimate);
          });
        }

        // Stop observing anchor element after inner elements were animated
        observer.unobserve(entry.target);
      }
    });
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: [0.1, 0.25, 0.5, 0.75, 1],
  }
);

/*
  Watch for mutations in the body and start observing the newly added animated elements and anchors
*/
function bodyMutationObserver() {
  const bodyObserver = new MutationObserver(mutationCallback);
  bodyObserver.observe(document.body, observerConfig);
}

/*
  Observe animated elements that have attribute [data-aos]
*/
function elementsIntersectionObserver() {
  const elementsToAnimate = document.querySelectorAll(selectors.aos);

  if (elementsToAnimate.length) {
    elementsToAnimate.forEach((element) => {
      aosItemObserver.observe(element);
    });
  }
}

/*
  Observe animated elements that have attribute [data-aos]
*/
function anchorsIntersectionObserver() {
  const anchors = document.querySelectorAll(selectors.aosAnchor);

  if (anchors.length) {
    // Get all anchors and attach observers
    initAnchorObservers(anchors);
  }
}

function initAnchorObservers(anchors) {
  let anchorContainers = [];

  if (!anchors.length) return;

  anchors.forEach((anchor) => {
    const containerId = anchor.dataset.aosAnchor;

    // Avoid adding multiple observers to the same element
    if (containerId && anchorContainers.indexOf(containerId) === -1) {
      const container = document.querySelector(containerId);

      if (container) {
        aosAnchorObserver.observe(container);
        anchorContainers.push(containerId);
      }
    }
  });
}

function initAnimations() {
  elementsIntersectionObserver();
  anchorsIntersectionObserver();
  bodyMutationObserver();
}

export {initAnimations};
