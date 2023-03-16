import {register} from '../vendor/theme-scripts/theme-sections';
import {popoutSection} from '../features/popout';
import fadeIn from '../util/fade-in';
import tabs from '../features/tabs';
import {QuickAddProduct} from '../features/quick-add-product';
import {makeGridSwatches} from '../features/swatch';
import {Siblings} from '../features/siblings';
import {Slider} from '../features/slider';

const selectors = {
  apiRelatedProductsTemplate: '[data-api-related-template]',
  relatedSection: '[data-related-section]',
  relatedProduct: '[data-product-grid-item]',
  recentlyViewed: '[data-recent-wrapper]',
  recentlyViewedWrapper: '[data-recently-viewed-wrapper]',
  productItem: '.product-item',
  slider: '[data-slider]',
};

const attributes = {
  limit: 'data-limit',
  minimum: 'data-minimum',
  productId: 'data-product-id',
};

const classes = {
  isHidden: 'is-hidden',
};

const sections = {};
class Related {
  constructor(section) {
    this.section = section;
    this.sectionId = section.id;
    this.container = section.container;

    this.related();
    this.recent();
  }

  related() {
    const relatedSection = this.container.querySelector(selectors.relatedSection);

    if (!relatedSection) {
      return;
    }

    const relatedProducts = relatedSection.querySelectorAll(selectors.relatedProduct);
    const productId = relatedSection.getAttribute(attributes.productId);
    const limit = relatedSection.getAttribute(attributes.limit);
    const requestUrl = `${window.theme.routes.product_recommendations_url}?section_id=api-product-recommendation&limit=${limit}&product_id=${productId}&intent=related`;

    fetch(requestUrl)
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        const relatedContent = document.createElement('div');
        relatedContent.innerHTML = new DOMParser().parseFromString(data, 'text/html').querySelector(selectors.apiRelatedProductsTemplate).innerHTML;
        const hasProducts = relatedContent.querySelector(selectors.relatedProduct);

        if (hasProducts) {
          relatedSection.innerHTML = relatedContent.innerHTML;
          makeGridSwatches(this.section);

          // Init Siblings
          new Siblings(this.section);

          if (relatedProducts.length > 4 && relatedSection.querySelector(selectors.slider)) {
            new Slider(relatedSection);
          }
        } else {
          relatedSection.dispatchEvent(
            new CustomEvent('theme:tab:hide', {
              bubbles: true,
            })
          );
        }
      })
      .catch(function () {
        relatedSection.dispatchEvent(
          new CustomEvent('theme:tab:hide', {
            bubbles: true,
          })
        );
      });
  }

  recent() {
    const recentlyViewed = this.container.querySelector(selectors.recentlyViewed);
    const howManyToshow = recentlyViewed ? parseInt(recentlyViewed.getAttribute(attributes.limit)) : 4;

    Shopify.Products.showRecentlyViewed({
      howManyToShow: howManyToshow,
      wrapperId: `recently-viewed-products-${this.sectionId}`,
      section: this.section,
      onComplete: (wrapper, section) => {
        const container = section.container;
        const recentlyViewedHolder = container.querySelector(selectors.recentlyViewed);
        const recentlyViewedWrapper = container.querySelector(selectors.recentlyViewedWrapper);
        const recentProducts = wrapper.querySelectorAll(selectors.productItem);
        const minimumNumberProducts = recentlyViewedHolder.hasAttribute(attributes.minimum) ? parseInt(recentlyViewedHolder.getAttribute(attributes.minimum)) : 4;
        const checkRecentInRelated = !recentlyViewedWrapper && recentProducts.length > 0;
        const checkRecentOutsideRelated = recentlyViewedWrapper && recentProducts.length >= minimumNumberProducts;

        if (checkRecentInRelated || checkRecentOutsideRelated) {
          if (checkRecentOutsideRelated) {
            recentlyViewedWrapper.classList.remove(classes.isHidden);
          }

          fadeIn(recentlyViewedHolder);

          recentlyViewedHolder.dispatchEvent(
            new CustomEvent('theme:tab:check', {
              bubbles: true,
            })
          );

          makeGridSwatches(section);

          // Init Siblings
          new Siblings(section);

          if (recentProducts.length > 4 && recentlyViewedHolder.querySelector(selectors.slider)) {
            new Slider(recentlyViewedHolder);
          }
        }
      },
    });
  }
}

const relatedSection = {
  onLoad() {
    sections[this.id] = new Related(this);
  },
};

register('related', [relatedSection, popoutSection, tabs]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
