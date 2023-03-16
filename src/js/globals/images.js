const classes = {
  loading: 'is-loading',
};

const selectors = {
  img: 'img.is-loading',
};

/*
  Catch images loaded events and add class "is-loaded" to them and their containers
*/
function loadedImagesEventHook() {
  document.addEventListener(
    'load',
    (e) => {
      if (e.target.tagName == 'IMG' && e.target.classList.contains(classes.loading)) {
        e.target.classList.remove(classes.loading);
        e.target.parentNode.classList.remove(classes.loading);
      }
    },
    true
  );
}

/*
  Remove "is-loading" class to the loaded images and their containers
*/
function removeLoadingClassFromLoadedImages(container) {
  container.querySelectorAll(selectors.img).forEach((img) => {
    if (img.complete) {
      img.classList.remove(classes.loading);
      img.parentNode.classList.remove(classes.loading);
    }
  });
}

export {loadedImagesEventHook, removeLoadingClassFromLoadedImages};
