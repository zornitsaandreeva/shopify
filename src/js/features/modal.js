import fadeIn from '../util/fade-in';
import fadeOut from '../util/fade-out';
import * as a11y from '../vendor/theme-scripts/theme-a11y';

const selectors = {
  modalUnderlay: '[data-modal-underlay]',
};

export function showModal(element, onInit, onClose) {
  const thisModal = element;

  if (typeof onInit === 'function') {
    fadeIn(thisModal, 'block', onInit);
  } else {
    fadeIn(thisModal);
  }

  thisModal.addEventListener('click', function (e) {
    const target = e.target;
    if (target.classList.contains('close') || target.matches(selectors.modalUnderlay)) {
      if (typeof onClose === 'function') {
        fadeOut(thisModal, onClose);
      } else {
        fadeOut(thisModal);
      }
      e.preventDefault();
      a11y.removeTrapFocus();
      e.preventDefault();
    }
  });

  thisModal.addEventListener('keyup', (e) => {
    if (e.code !== window.theme.keyboardKeys.ESCAPE) {
      return;
    }
    if (typeof onClose === 'function') {
      fadeOut(thisModal, onClose);
    } else {
      fadeOut(thisModal);
    }

    a11y.removeTrapFocus();
    e.preventDefault();
  });

  thisModal.querySelectorAll(window.theme.focusable)[0].focus();
}
