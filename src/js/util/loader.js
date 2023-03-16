import getScript from './get-script';

const loaders = {};
window.isYoutubeAPILoaded = false;
window.isVimeoAPILoaded = false;

export default function loadScript(options = {}) {
  if (!options.type) {
    options.type = 'json';
  }

  if (options.url) {
    if (loaders[options.url]) {
      return loaders[options.url];
    } else {
      return getScriptWithPromise(options.url, options.type);
    }
  } else if (options.json) {
    if (loaders[options.json]) {
      return Promise.resolve(loaders[options.json]);
    } else {
      return window
        .fetch(options.json)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          loaders[options.json] = response;
          return response;
        });
    }
  } else if (options.name) {
    const key = ''.concat(options.name, options.version);
    if (loaders[key]) {
      return loaders[key];
    } else {
      return loadShopifyWithPromise(options);
    }
  } else {
    return Promise.reject();
  }
}

function getScriptWithPromise(url, type) {
  const loader = new Promise((resolve, reject) => {
    if (type === 'text') {
      fetch(url)
        .then((response) => response.text())
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      getScript(
        url,
        function () {
          resolve();
        },
        function () {
          reject();
        }
      );
    }
  });

  loaders[url] = loader;
  return loader;
}

function loadShopifyWithPromise(options) {
  const key = ''.concat(options.name, options.version);
  const loader = new Promise((resolve, reject) => {
    try {
      window.Shopify.loadFeatures([
        {
          name: options.name,
          version: options.version,
          onLoad: (err) => {
            onLoadFromShopify(resolve, reject, err);
          },
        },
      ]);
    } catch (err) {
      reject(err);
    }
  });
  loaders[key] = loader;
  return loader;
}

function onLoadFromShopify(resolve, reject, err) {
  if (err) {
    return reject(err);
  } else {
    return resolve();
  }
}
