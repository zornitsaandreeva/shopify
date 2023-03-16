import * as a11y from '../vendor/theme-scripts/theme-a11y';
import {getWindowHeight} from '../util/media-query';

import HeaderSearchForm from './header-search-form';

const selectors = {
  allVisibleElements: '[role="option"]',
  ariaSelected: '[aria-selected="true"]',
  header: '[data-header-height]',
  popularSearches: '[data-popular-searches]',
  predictiveSearch: 'predictive-search',
  predictiveSearchResults: '[data-predictive-search-results]',
  predictiveSearchStatus: '[data-predictive-search-status]',
  searchInput: 'input[type="search"]',
  searchPopdown: '[data-popdown]',
  searchResultsLiveRegion: '[data-predictive-search-live-region-count-value]',
  searchResultsGroupsWrapper: 'data-search-results-groups-wrapper',
  searchForText: '[data-predictive-search-search-for-text]',
  sectionPredictiveSearch: '#shopify-section-predictive-search',
  selectedLink: '[aria-selected="true"] a',
  selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
};

class PredictiveSearch extends HeaderSearchForm {
  constructor() {
    super();
    this.a11y = a11y;
    this.abortController = new AbortController();
    this.allPredictiveSearchInstances = document.querySelectorAll(selectors.predictiveSearch);
    this.cachedResults = {};
    this.input = this.querySelector(selectors.searchInput);
    this.isOpen = false;
    this.predictiveSearchResults = this.querySelector(selectors.predictiveSearchResults);
    this.searchPopdown = this.closest(selectors.searchPopdown);
    this.popularSearches = this.searchPopdown?.querySelector(selectors.popularSearches);
    this.searchTerm = '';
  }

  connectedCallback() {
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    super.onChange();
    const newSearchTerm = this.getQuery();

    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      // Remove the results when they are no longer relevant for the new search term
      // so they don't show up when the dropdown opens again
      this.querySelector(selectors.searchResultsGroupsWrapper)?.remove();
    }

    // Update the term asap, don't wait for the predictive search query to finish loading
    this.updateSearchForTerm(this.searchTerm, newSearchTerm);

    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.reset();
      return;
    }

    this.getSearchResults(this.searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector(selectors.selectedLink)) event.preventDefault();
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = '';
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
    }
  }

  shouldResetForm() {
    return !document.querySelector(selectors.selectedLink);
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      // Search term was changed from other search input, treat it as a user change
      this.onChange();
    } else if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up');
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector(selectors.searchForText);
    const currentButtonText = searchForTextElement?.innerText;

    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, 'g'))?.length > 1) {
        // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
        return;
      }
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }

  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const selectedElement = this.querySelector(selectors.ariaSelected);

    // Filter out hidden elements (duplicated page and article resources) thanks
    // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    const allVisibleElements = Array.from(this.querySelectorAll(selectors.allVisibleElements)).filter((element) => element.offsetParent !== null);

    let activeElementIndex = 0;

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;

    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }

    this.statusElement.textContent = '';

    if (!moveUp && selectedElement) {
      activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];

    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedOption = this.querySelector(selectors.selectedOption);

    if (selectedOption) selectedOption.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`, {signal: this.abortController.signal})
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector(selectors.sectionPredictiveSearch).innerHTML;
        // Save bandwidth keeping the cache in all instances synced
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        });
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          // Code 20 means the call was aborted
          return;
        }
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector(selectors.predictiveSearchStatus);
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute('aria-hidden', 'true');
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;

    this.setAttribute('results', true);

    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector(selectors.searchResultsLiveRegion).textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight = getWindowHeight() - document.querySelector(selectors.header).getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
    }
    const selected = this.querySelector(selectors.ariaSelected);

    if (selected) selected.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('loading');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults?.removeAttribute('style');
  }

  reset() {
    this.predictiveSearchResults.innerHTML = '';

    this.input.val = '';
    this.a11y.removeTrapFocus();

    if (this.popularSearches) {
      this.input.dispatchEvent(new Event('blur', {bubbles: false}));
      this.a11y.trapFocus(this.searchPopdown, {
        elementToFocus: this.input,
      });
    }
  }
}

customElements.define('predictive-search', PredictiveSearch);
