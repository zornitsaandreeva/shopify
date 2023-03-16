import {configure} from '@testing-library/cypress';
import 'cypress-real-events/support';
import './commands';

configure({testIdAttribute: 'data-test-id'});

let observer;

beforeEach(() => {
  Cypress.on('window:load', (window) => {
    // Get rid of shopify's preview bar when it appears as it interferes with tests

    const targetNode = window.document.body;
    const config = {childList: true, subtree: true};

    // Callback function to execute when mutations are observed
    const callback = () => {
      const previewBar = window.document.getElementById('preview-bar-iframe');
      if (previewBar) {
        previewBar.remove();
      }
    };

    observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  });

  Cypress.on('window:unload', () => {
    if (observer) {
      observer.disconnect();
    }
  });
});
