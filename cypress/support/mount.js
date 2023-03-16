import {ROOT_SELECTOR} from '@cypress/mount-utils';

export function mount(html) {
  if (!html) throw new Error('No HTML provided');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const errorNode = doc.querySelector('parsererror');
  const root = document.querySelector(ROOT_SELECTOR);

  if (!root) {
    throw new Error([`🔥 Hmm, cannot find the root element "${ROOT_ID}" to mount to`].join(' '));
  }

  if (errorNode) {
    console.log({errorNode});
    throw new Error(`🔥 Could not parse the provided HTML: ${errorNode.innerText}`);
  }

  root.innerHTML = html;

  const displayName = root.firstChild?.nodeName || 'Component';

  return (
    cy
      .wrap(html, {log: false})
      .as(displayName)
      // by waiting, we delaying test execution for the next tick of event loop
      // and letting lifecycle methods execute mount
      .wait(0, {log: false})
  );
}
