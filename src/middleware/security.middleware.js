const helmet = require('helmet');

function setupSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
}

module.exports = {
  setupSecurity,
};
