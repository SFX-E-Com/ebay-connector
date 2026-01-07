'use client';

import { useEffect } from 'react';

export default function APIDocumentationPage() {
  useEffect(() => {
    // Dynamically load Swagger UI CSS and JS
    const loadSwaggerUI = async () => {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
      document.head.appendChild(cssLink);

      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
      script.onload = () => {
        // Initialize Swagger UI after script loads
        const SwaggerUIBundle = (window as any).SwaggerUIBundle;
        if (SwaggerUIBundle) {
          SwaggerUIBundle({
            url: '/api/swagger',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            plugins: [
              (window as any).SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: 'BaseLayout',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'patch'],
            validatorUrl: null,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            customCss: `
              .topbar { display: none }
              .swagger-ui .info { margin: 20px 0 }
              .swagger-ui .info .title { font-size: 2em; color: #1a202c; font-weight: 700; }
              .swagger-ui .info .description { color: #2d3748; font-size: 1.1em; line-height: 1.6; }
              .swagger-ui .opblock-tag { font-size: 1.2em; color: #1a202c; }
              .swagger-ui .opblock .opblock-summary-description { color: #2d3748; }
              .swagger-ui .opblock .opblock-summary-path { color: #1a202c; font-weight: 600; }
              .swagger-ui .parameter__name { color: #1a202c; font-weight: 600; }
              .swagger-ui .parameter__type { color: #2d3748; }
              .swagger-ui .prop-type { color: #2d3748; }
              .swagger-ui .prop-format { color: #4a5568; }
              .swagger-ui .renderedMarkdown p { color: #2d3748; }
              .swagger-ui .response-col_description { color: #2d3748; }
              .swagger-ui table thead tr th { color: #1a202c; font-weight: 600; }
              .swagger-ui table tbody tr td { color: #2d3748; }
              .swagger-ui .scheme-container { background: #f7fafc; box-shadow: none; }
              .swagger-ui .model-title { color: #1a202c; font-weight: 600; }
              .swagger-ui .model-title code { color: #2d3748; }
            `
          });
        }
      };
      document.head.appendChild(script);
    };

    loadSwaggerUI();

    // Cleanup function
    return () => {
      // Remove Swagger UI elements on unmount
      const swaggerCSS = document.querySelector('link[href*="swagger-ui.css"]');
      const swaggerJS = document.querySelector('script[src*="swagger-ui-bundle.js"]');
      if (swaggerCSS) swaggerCSS.remove();
      if (swaggerJS) swaggerJS.remove();
    };
  }, []);

  return (
    <div
      id="swagger-ui"
      className="bg-white rounded-4 flex-grow-1 p-3 p-md-4"
      style={{ minHeight: 0 }}
    />
  );
}