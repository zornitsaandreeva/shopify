let isCompleted = false;
let docComplete = false;

function preloadImages() {
  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      docComplete = true;
      initImagesPreloader();
    }
  };

  requestIdleCallback(initImagesPreloader);
}

function initImagesPreloader() {
  setTimeout(() => {
    if (isCompleted) return;

    if (!docComplete) {
      initImagesPreloader();
      return;
    }

    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if (lazyImages.length) {
      lazyImages.forEach((image) => {
        image.setAttribute('loading', 'eager');
      });
    }

    isCompleted = true;
  }, 3000);
}

export default preloadImages;
