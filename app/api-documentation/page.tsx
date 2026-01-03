'use client';

import { useEffect } from 'react';
import { Box } from '@chakra-ui/react';

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
              .swagger-ui { filter: invert(0.88) hue-rotate(180deg); }
              .swagger-ui .info { margin: 20px 0 }
              .swagger-ui .info .title { font-size: 2em }
              .swagger-ui .opblock-tag { font-size: 1.2em }
              
              /* Fix images/logos inversion */
              .swagger-ui img { filter: invert(1) hue-rotate(180deg); }
              
              /* Adjust specific colors after inversion if needed */
              .swagger-ui .scheme-container { background: transparent; box-shadow: none; }
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
    <Box
      id="swagger-ui"
      bg={{ base: "white", _dark: "gray.900" }}
      borderRadius="xl"
      minH="100%"
      p={4}
    />
  );
}