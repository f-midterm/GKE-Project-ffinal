// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Import cypress-mochawesome-reporter
import 'cypress-mochawesome-reporter/register';

// Handle uncaught exceptions to prevent test failures from app errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // You can customize this to only ignore specific errors
  console.error('Uncaught exception:', err.message);
  return false;
});

// Add custom command to login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });
});

// Add custom command to check backend health
Cypress.Commands.add('checkBackendHealth', () => {
  cy.request({
    method: 'GET',
    url: 'http://localhost:8080/actuator/health',
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.status).to.eq('UP');
  });
});