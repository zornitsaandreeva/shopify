export function fetchProduct(handle) {
  const requestRoute = `${window.theme.routes.root}products/${handle}.js`;

  return window
    .fetch(requestRoute)
    .then((response) => {
      return response.json();
    })
    .catch((e) => {
      console.error(e);
    });
}
