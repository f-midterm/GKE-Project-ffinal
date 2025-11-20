import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    video: true,
    screenshotOnRunFailure: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry failed tests
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    setupNodeEvents(on, config) {
      // Import cypress-mochawesome-reporter plugin
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
  
  // Mochawesome reporter configuration
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/results',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    reportPageTitle: 'Apartment App E2E Tests',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false
  }
});
