// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import '@testing-library/cypress/add-commands';

Cypress.Commands.add('selectTheme', () => {
  cy.session('login', () => {
    if (Cypress.env('STOREFRONT_PASSWORD')) {
      cy.visit(Cypress.env('THEME_URL'));
      cy.get('input[type=password]').type(Cypress.env('STOREFRONT_PASSWORD'));
      cy.findByRole('button', {name: 'Enter'}).click();
    } else {
      cy.visit(Cypress.env('THEME_URL'));
    }
  });
});

/**
 * Faceted search filtering on collection and search pages
 * Theme store requirements / 3.Features / Faceted search filtering
 * @param {string} path - location pathname for the page that would be visited for testing
 * @param {boolean} change - whether change events should be triggered for the filter inputs
 * @param {boolean} apply - whether filters are already applied and tests for removing them should be executed
 */
Cypress.Commands.add('testFilters', (path, change, apply) => {
  const loadSearchPage = path.indexOf('search') > -1 && path !== '';
  const loadCollectionPage = path.indexOf('collection') > -1 && path !== '';
  const onChangedFilters = change === true;
  const onAppliedFilters = apply === true;
  const url = Cypress.config('baseUrl') + path;

  if (loadCollectionPage || loadSearchPage) {
    cy.visit(url);
  }

  if (loadSearchPage) {
    // if this fails, test should be run with a different query parameter in the `${path}`
    cy.get('[data-cy-results]').as('results');
    cy.get('@results').should('not.have.attr', 'data-cy-results', '0');
  }

  // assert the page has filters
  cy.get('[data-cy-filter]').as('filter');
  cy.get('[data-cy-filters-form]').as('filtersForm');
  cy.get('@filter').should('have.length.greaterThan', 0);

  // test available filters: on changed, on applied and on cleared
  cy.get(`[data-cy-filter]`)
    .each(($filter, index) => {
      const type = $filter.data('cy-filter-type');

      if (type === 'list' || type === 'boolean') {
        const input = $filter.find('input[type="checkbox"]').first();
        const name = input.attr('name');
        const val = input.val();

        // trigger change on the filter
        if (onChangedFilters) {
          input.click();
        }

        // assert that the filter is applied
        if (onAppliedFilters) {
          cy.location('href').should('contain', `${name}=${val}`);
          cy.get('[data-cy-filters-remove]').should(($el) => {
            expect($el[index].getAttribute('href')).not.to.contain(`${name}=${val}`);
          });
        }
      }

      if (type === 'price_range') {
        const input = $filter.find('input[type="number"]').first();
        const name = input.attr('name');
        const val = input.val();
        const min = Number(input.attr('min'));
        const max = Number(input.attr('max'));
        const newVal = Math.floor(Math.random() * (max - min) + min);

        // trigger change on the filter
        if (onChangedFilters) {
          input.val(newVal).trigger('input');
          cy.get('@filtersForm').submit();
        }

        // assert that the filter is applied
        if (onAppliedFilters) {
          cy.location('href').should('contain', `${name}=${val}`);
          cy.get('[data-cy-filters-remove]').should(($el) => {
            expect($el[index].getAttribute('href')).not.to.contain(`${name}=${val}`);
          });
        }
      }
    })
    // assertions for removing and clearing the applied filters
    .then(($filter) => {
      if (onAppliedFilters) {
        const type = $filter.data('cy-filter-type');
        let removedFilter = '';

        // remove the first of all active filters
        if (type === 'list' || type === 'boolean') {
          const input = $filter.find('input[type="checkbox"]').first();
          removedFilter = `${input.attr('name')}=${input.val()}`;
        }

        if (type === 'price_range') {
          const input = $filter.find('input[type="number"]').first();
          removedFilter = `${input.attr('name')}=${input.val()}`;
        }

        cy.get('[data-cy-filters-remove]')
          .then(($el) => $el[0].click())
          .should('not.exist');
        cy.location('href').should('not.contain', `${removedFilter}`);

        // clear all filters
        // needs at least three storefront filters, so that two active filters are applied on this step
        cy.get('[data-cy-filters-remove]').then(($el) => {
          if ($el.length > 1) {
            cy.get('[data-cy-filters-clear]').click().should('not.exist');
            cy.get('[data-cy-filters-remove]').should('not.exist');
          }
        });
      }
    });
});

/**
 * Localization Form submit
 * Theme store requirements / 3.Features / Country selection && Language selection
 * @param {string} alias - alias of selected country/language button (list option) from the localization form
 * @param {string} name - name attribute of the localization form's hidden input
 */
Cypress.Commands.add('submitLocalizationForm', (alias, name) => {
  let isCurrencyCode = false;
  let isCountryCode = false;
  let isLangCode = false;

  cy.get(name).then((code) => {
    isCurrencyCode = code === 'currency_code';
    isCountryCode = code === 'country_code';
    isLangCode = code === 'language_code';
  });

  cy.get(alias).then(($el) => {
    // submit the form
    const $btn = $el.get(0);
    const val = $btn.getAttribute('data-value');

    $btn.click();

    // assertions on page load after the form is submited
    if (isCountryCode) {
      cy.window().its('Shopify.country').should('eql', val);
    }

    if (isCurrencyCode) {
      cy.window().its('Shopify.currency.active').should('eql', val);
    }

    if (isLangCode) {
      cy.window().its('Shopify.locale').should('eql', val);
    }

    // UX assertions - active state of the selector
    // eslint-disable-next-line promise/no-nesting
    cy.get(`[data-value="${val}"]`).then(($el) => {
      const currentAttr = $el.get(0).getAttribute('aria-current');
      expect(currentAttr).to.equal('true');
    });
  });
});
