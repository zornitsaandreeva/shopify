// / <reference types="Cypress" />

describe('Cart', () => {
  beforeEach(() => {
    cy.selectTheme();
  });

  it('it lets me view cart page', () => {
    cy.log('Visit cart page');
    cy.visit('/cart');
    cy.log('Check that the cart is empty');
    cy.findAllByText(/Your Cart is Empty/).should('exist');
  });
});
