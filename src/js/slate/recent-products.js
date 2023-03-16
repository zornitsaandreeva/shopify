/**
 * Module to show Recently Viewed Products
 *
 * Copyright (c) 2014 Caroline Schnapp (11heavens.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
import showElement from '../util/show-element';

Shopify.Products = (function () {
  const config = {
    howManyToShow: 4,
    howManyToStoreInMemory: 10,
    wrapperId: 'recently-viewed-products',
    section: null,
    onComplete: null,
  };

  let productHandleQueue = [];
  let wrapper = null;
  let howManyToShowItems = null;

  const cookie = {
    configuration: {
      expires: 90,
      path: '/',
      domain: window.location.hostname,
      sameSite: 'none',
      secure: true,
    },
    name: 'shopify_recently_viewed',
    write: function (recentlyViewed) {
      const recentlyViewedString = recentlyViewed.join(' ');
      document.cookie = `${this.name}=${recentlyViewedString}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
    },
    read: function () {
      let recentlyViewed = [];
      let cookieValue = null;

      if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
        cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith(this.name))
          .split('=')[1];
      }

      if (cookieValue !== null) {
        recentlyViewed = cookieValue.split(' ');
      }

      return recentlyViewed;
    },
    destroy: function () {
      const cookieVal = null;
      document.cookie = `${this.name}=${cookieVal}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
    },
    remove: function (productHandle) {
      const recentlyViewed = this.read();
      const position = recentlyViewed.indexOf(productHandle);
      if (position !== -1) {
        recentlyViewed.splice(position, 1);
        this.write(recentlyViewed);
      }
    },
  };

  const finalize = (wrapper, section) => {
    showElement(wrapper, true);
    const cookieItemsLength = cookie.read().length;

    if (Shopify.recentlyViewed && howManyToShowItems && cookieItemsLength && cookieItemsLength < howManyToShowItems && wrapper.children.length) {
      let allClassesArr = [];
      let addClassesArr = [];
      let objCounter = 0;
      for (const property in Shopify.recentlyViewed) {
        objCounter += 1;
        const objString = Shopify.recentlyViewed[property];
        const objArr = objString.split(' ');
        const propertyIdx = parseInt(property.split('_')[1]);
        allClassesArr = [...allClassesArr, ...objArr];

        if (cookie.read().length === propertyIdx || (objCounter === Object.keys(Shopify.recentlyViewed).length && !addClassesArr.length)) {
          addClassesArr = [...addClassesArr, ...objArr];
        }
      }

      for (let i = 0; i < wrapper.children.length; i++) {
        const element = wrapper.children[i];
        if (allClassesArr.length) {
          element.classList.remove(...allClassesArr);
        }

        if (addClassesArr.length) {
          element.classList.add(...addClassesArr);
        }
      }
    }

    // If we have a callback.
    if (config.onComplete) {
      try {
        config.onComplete(wrapper, section);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const moveAlong = (shown, productHandleQueue, wrapper, section) => {
    if (productHandleQueue.length && shown < config.howManyToShow) {
      fetch(`${window.theme.routes.root}products/${productHandleQueue[0]}?section_id=api-product-grid-item`)
        .then((response) => response.text())
        .then((product) => {
          const aosDelay = shown * 150;
          const aosImageDuration = shown * 100 + 800;
          const aosTextDuration = shown * 50 + 800;
          const anchorAnimation = wrapper.id ? `#${wrapper.id}` : '';
          const fresh = document.createElement('div');
          let productReplaced = product.includes('||itemIndex||') ? product.replaceAll('||itemIndex||', shown) : product;
          productReplaced = productReplaced.includes('||itemAosDelay||') ? productReplaced.replaceAll('||itemAosDelay||', aosDelay) : productReplaced;
          productReplaced = productReplaced.includes('||itemAosImageDuration||') ? productReplaced.replaceAll('||itemAosImageDuration||', aosImageDuration) : productReplaced;
          productReplaced = productReplaced.includes('||itemAosTextDuration||') ? productReplaced.replaceAll('||itemAosTextDuration||', aosTextDuration) : productReplaced;
          productReplaced = productReplaced.includes('||itemAnimationAnchor||') ? productReplaced.replaceAll('||itemAnimationAnchor||', anchorAnimation) : productReplaced;
          fresh.innerHTML = productReplaced;

          wrapper.innerHTML += fresh.querySelector('[data-api-content]').innerHTML;

          productHandleQueue.shift();
          shown++;
          moveAlong(shown, productHandleQueue, wrapper, section);
        })
        .catch(() => {
          cookie.remove(productHandleQueue[0]);
          productHandleQueue.shift();
          moveAlong(shown, productHandleQueue, wrapper, section);
        });
    } else {
      finalize(wrapper, section);
    }
  };

  return {
    showRecentlyViewed: function (params) {
      const paramsNew = params || {};
      const shown = 0;

      // Update defaults.
      Object.assign(config, paramsNew);

      // Read cookie.
      productHandleQueue = cookie.read();

      // Element where to insert.
      wrapper = document.querySelector(`#${config.wrapperId}`);

      // How many products to show.
      howManyToShowItems = config.howManyToShow;
      config.howManyToShow = Math.min(productHandleQueue.length, config.howManyToShow);

      // If we have any to show.
      if (config.howManyToShow && wrapper) {
        // Getting each product with an Ajax call and rendering it on the page.
        moveAlong(shown, productHandleQueue, wrapper, config.section);
      }
    },

    getConfig: function () {
      return config;
    },

    clearList: function () {
      cookie.destroy();
    },

    recordRecentlyViewed: function (params) {
      const paramsNew = params || {};

      // Update defaults.
      Object.assign(config, paramsNew);

      // Read cookie.
      let recentlyViewed = cookie.read();

      // If we are on a product page.
      if (window.location.pathname.indexOf('/products/') !== -1) {
        // What is the product handle on this page.
        let productHandle = decodeURIComponent(window.location.pathname)
          .match(
            /\/products\/([a-z0-9\-]|[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|[\u203B]|[\w\u0430-\u044f]|[\u0400-\u04FF]|[\u0900-\u097F]|[\u0590-\u05FF\u200f\u200e]|[\u0621-\u064A\u0660-\u0669 ])+/
          )[0]
          .split('/products/')[1];

        if (config.handle) {
          productHandle = config.handle;
        }

        // In what position is that product in memory.
        const position = recentlyViewed.indexOf(productHandle);

        // If not in memory.
        if (position === -1) {
          // Add product at the start of the list.
          recentlyViewed.unshift(productHandle);
          // Only keep what we need.
          recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
        } else {
          // Remove the product and place it at start of list.
          recentlyViewed.splice(position, 1);
          recentlyViewed.unshift(productHandle);
        }

        // Update cookie.
        cookie.write(recentlyViewed);
      }
    },

    hasProducts: cookie.read().length > 0,
  };
})();
