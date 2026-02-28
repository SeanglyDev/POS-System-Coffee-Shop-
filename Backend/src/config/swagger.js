const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

function setupSwagger(app) {
  const swaggerPath = path.join(__dirname, '..', 'swagger.yaml');
  if (!fs.existsSync(swaggerPath)) {
    return;
  }

  const swaggerDocument = YAML.load(swaggerPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
