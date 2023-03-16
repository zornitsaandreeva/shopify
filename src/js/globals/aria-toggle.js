function ariaToggle(container) {
  const toggleButtons = container.querySelectorAll('[data-aria-toggle]');
  if (toggleButtons.length) {
    toggleButtons.forEach((element) => {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        const currentTarget = event.currentTarget;
        currentTarget.setAttribute('aria-expanded', currentTarget.getAttribute('aria-expanded') == 'false' ? 'true' : 'false');
        const toggleID = currentTarget.getAttribute('aria-controls');
        const toggleElement = document.querySelector(`#${toggleID}`);
        const removeExpandingClass = () => {
          toggleElement.classList.remove('expanding');
          toggleElement.removeEventListener('transitionend', removeExpandingClass);
        };
        const addExpandingClass = () => {
          toggleElement.classList.add('expanding');
          toggleElement.removeEventListener('transitionstart', addExpandingClass);
        };

        toggleElement.addEventListener('transitionstart', addExpandingClass);
        toggleElement.addEventListener('transitionend', removeExpandingClass);

        toggleElement.classList.toggle('expanded');
      });
    });
  }
}

export {ariaToggle};
