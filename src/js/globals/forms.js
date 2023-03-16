function floatLabels(container) {
  const floats = container.querySelectorAll('.form-field');
  floats.forEach((element) => {
    const label = element.querySelector('label');
    const input = element.querySelector('input, textarea');
    if (label && input) {
      input.addEventListener('keyup', (event) => {
        if (event.target.value !== '') {
          label.classList.add('label--float');
        } else {
          label.classList.remove('label--float');
        }
      });
      if (input.value && input.value.length) {
        label.classList.add('label--float');
      }
    }
  });
}

export default floatLabels;
