import debounce from '../util/debounce';
import Collection from '../sections/collection';
import scrollTo from '../util/scroll-to';

import {Siblings} from './siblings';
import {RangeSlider} from './range-slider';
import {makeGridSwatches} from './swatch';

const selectors = {
  collectionSidebar: '[data-collection-sidebar]',
  form: '[data-collection-filters-form]',
  input: 'input',
  select: 'select',
  label: 'label',
  textarea: 'textarea',
  priceMin: '[data-field-price-min]',
  priceMax: '[data-field-price-max]',
  priceMinValue: 'data-field-price-min',
  priceMaxValue: 'data-field-price-max',
  rangeMin: '[data-se-min-value]',
  rangeMax: '[data-se-max-value]',
  rangeMinValue: 'data-se-min-value',
  rangeMaxValue: 'data-se-max-value',
  rangeMinDefault: 'data-se-min',
  rangeMaxDefault: 'data-se-max',
  productsContainer: '[data-products-grid]',
  product: '[data-product-grid-item]',
  filterUpdateUrlButton: '[data-filter-update-url]',
  activeFilters: '[data-active-filters]',
  activeFiltersCount: 'data-active-filters-count',
  sort: 'data-sort-enabled',
  collectionNav: '[data-collection-nav]',
};

const classes = {
  hidden: 'hidden',
  loading: 'is-loading',
};

let sections = {};

class FiltersForm {
  constructor(section) {
    this.section = section;
    this.container = this.section.container;
    this.sidebar = this.container.querySelector(selectors.collectionSidebar);
    this.form = this.container.querySelector(selectors.form);
    this.sort = this.container.querySelector(`[${selectors.sort}]`);
    this.productsContainer = this.container.querySelector(selectors.productsContainer);
    this.collectionNav = this.container.querySelector(selectors.collectionNav);
    this.init();
  }

  init() {
    if (this.form) {
      this.initRangeSlider();

      this.sidebar.addEventListener(
        'input',
        debounce((e) => {
          const type = e.type;
          const target = e.target;

          if (type === selectors.input || type === selectors.select || type === selectors.label || type === selectors.textarea) {
            if (this.form && typeof this.form.submit === 'function') {
              const priceMin = this.form.querySelector(selectors.priceMin);
              const priceMax = this.form.querySelector(selectors.priceMax);
              if (priceMin && priceMax) {
                if (target.hasAttribute(selectors.priceMinValue) && !priceMax.value) {
                  priceMax.value = priceMax.placeholder;
                } else if (target.hasAttribute(selectors.priceMaxValue) && !priceMin.value) {
                  priceMin.value = priceMin.placeholder;
                }
              }

              this.submitForm(e);
            }
          }
        }, 500)
      );

      this.sidebar.addEventListener('theme:range:update', (e) => this.updateRange(e));
    }

    if (this.sidebar) {
      this.sidebar.addEventListener('click', (e) => this.filterUpdateFromUrl(e));
    }

    if (this.productsContainer) {
      this.productsContainer.addEventListener('click', (e) => this.filterUpdateFromUrl(e));
    }

    if (this.sort) {
      this.container.addEventListener('theme:filter:update', (e) => this.submitForm(e));
    }

    if (this.sidebar || this.sort) {
      window.addEventListener('popstate', (e) => this.submitForm(e));
    }
  }

  initRangeSlider() {
    new RangeSlider(this.form);
  }

  filterUpdateFromUrl(e) {
    const target = e.target;
    if (target.matches(selectors.filterUpdateUrlButton) || (target.closest(selectors.filterUpdateUrlButton) && target)) {
      e.preventDefault();
      const button = target.matches(selectors.filterUpdateUrlButton) ? target : target.closest(selectors.filterUpdateUrlButton);
      this.submitForm(e, button.getAttribute('href'));
    }
  }

  submitForm(e, replaceHref = '') {
    this.sort = this.container.querySelector(`[${selectors.sort}]`);
    const sortValue = this.sort ? this.sort.getAttribute(selectors.sort) : '';
    if (!e || (e && e.type !== 'popstate')) {
      if (replaceHref === '') {
        const url = new window.URL(window.location.href);
        let filterUrl = url.searchParams;
        const filterUrlEntries = filterUrl;
        const filterUrlParams = Object.fromEntries(filterUrlEntries);
        const filterUrlRemoveString = filterUrl.toString();

        if (filterUrlRemoveString.includes('filter.') || filterUrlRemoveString.includes('page=')) {
          for (const key in filterUrlParams) {
            if (key.includes('filter.') || key === 'page') {
              filterUrl.delete(key);
            }
          }
        }

        if (this.form) {
          const formData = new FormData(this.form);
          const formParams = new URLSearchParams(formData);
          const rangeMin = this.form.querySelector(selectors.rangeMin);
          const rangeMax = this.form.querySelector(selectors.rangeMax);
          const rangeMinDefaultValue = rangeMin && rangeMin.hasAttribute(selectors.rangeMinDefault) ? rangeMin.getAttribute(selectors.rangeMinDefault) : '';
          const rangeMaxDefaultValue = rangeMax && rangeMax.hasAttribute(selectors.rangeMaxDefault) ? rangeMax.getAttribute(selectors.rangeMaxDefault) : '';
          let priceFilterDefaultCounter = 0;

          for (let [key, val] of formParams.entries()) {
            if (key.includes('filter.') && val) {
              filterUrl.append(key, val);

              if ((val === rangeMinDefaultValue && key === 'filter.v.price.gte') || (val === rangeMaxDefaultValue && key === 'filter.v.price.lte')) {
                priceFilterDefaultCounter += 1;
              }
            }
          }

          if (priceFilterDefaultCounter === 2) {
            filterUrl.delete('filter.v.price.gte');
            filterUrl.delete('filter.v.price.lte');
          }
        }

        if (sortValue || (e && e.detail && e.detail.href)) {
          const sortString = sortValue ? sortValue : e.detail.href;
          filterUrl.set('sort_by', sortString);
        }

        const filterUrlString = filterUrl.toString();
        const filterNewParams = filterUrlString ? `?${filterUrlString}` : location.pathname;
        window.history.pushState(null, '', filterNewParams);
      } else {
        window.history.pushState(null, '', replaceHref);
      }
    } else if (this.sort) {
      this.sort.dispatchEvent(new CustomEvent('theme:filter:sort', {bubbles: false}));
    }

    if (this.productsContainer) {
      this.productsContainer.classList.add(classes.loading);
      fetch(`${window.location.pathname}${window.location.search}`)
        .then((response) => response.text())
        .then((data) => {
          this.productsContainer.innerHTML = new DOMParser().parseFromString(data, 'text/html').querySelector(selectors.productsContainer).innerHTML;

          if (this.sidebar) {
            this.sidebar.innerHTML = new DOMParser().parseFromString(data, 'text/html').querySelector(selectors.collectionSidebar).innerHTML;

            const activeFiltersCountContainer = this.sidebar.querySelector(`[${selectors.activeFiltersCount}]`);
            const activeFiltersContainer = this.container.querySelectorAll(selectors.activeFilters);
            if (activeFiltersCountContainer && activeFiltersContainer.length) {
              const activeFiltersCount = parseInt(activeFiltersCountContainer.getAttribute(selectors.activeFiltersCount));

              activeFiltersContainer.forEach((counter) => {
                counter.textContent = activeFiltersCount;
                counter.classList.toggle(classes.hidden, activeFiltersCount < 1);
              });
            }
          }

          if (this.form) {
            this.form = this.container.querySelector(selectors.form);

            // Init Range Slider
            this.initRangeSlider();
          }

          // Init Collection
          const collectionClass = new Collection(this.section);
          collectionClass.onUnload(false);

          // Init Grid Swatches
          makeGridSwatches(this.section);

          // Init Siblings
          new Siblings(this.section);

          // Init Tooltips
          document.dispatchEvent(
            new CustomEvent('theme:tooltip:close', {
              bubbles: false,
              detail: {
                hideTransition: false,
              },
            })
          );

          if (this.collectionNav) {
            scrollTo(this.productsContainer.getBoundingClientRect().top - this.collectionNav.offsetHeight);
          }

          setTimeout(() => {
            this.productsContainer.classList.remove(classes.loading);
          }, 500);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  updateRange(e) {
    if (this.form && typeof this.form.submit === 'function') {
      const rangeMin = this.form.querySelector(selectors.rangeMin);
      const rangeMax = this.form.querySelector(selectors.rangeMax);
      const priceMin = this.form.querySelector(selectors.priceMin);
      const priceMax = this.form.querySelector(selectors.priceMax);
      const checkElements = rangeMin && rangeMax && priceMin && priceMax;

      if (checkElements && rangeMin.hasAttribute(selectors.rangeMinValue) && rangeMax.hasAttribute(selectors.rangeMaxValue)) {
        const priceMinValue = parseInt(priceMin.placeholder);
        const priceMaxValue = parseInt(priceMax.placeholder);
        const rangeMinValue = parseInt(rangeMin.getAttribute(selectors.rangeMinValue));
        const rangeMaxValue = parseInt(rangeMax.getAttribute(selectors.rangeMaxValue));

        if (priceMinValue !== rangeMinValue || priceMaxValue !== rangeMaxValue) {
          priceMin.value = rangeMinValue;
          priceMax.value = rangeMaxValue;

          this.submitForm(e);
        }
      }
    }
  }
}

const collectionFiltersForm = {
  onLoad() {
    sections[this.id] = new FiltersForm(this);
  },
};
export default collectionFiltersForm;
