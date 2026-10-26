const http = require('node:http');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const enhanceDefaultMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const defaultMiddleware = enhanceDefaultMiddleware(middleware, server);

  return (req, res, next) => {
    if (!req.url || (!req.url.startsWith('/api/v1') && !req.url.startsWith('/uploads'))) {
      return defaultMiddleware(req, res, next);
    }

    const apiRequest = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, host: 'localhost:3001' },
      },
      (apiResponse) => {
        res.writeHead(apiResponse.statusCode || 502, apiResponse.headers);
        apiResponse.pipe(res);
      }
    );

    apiRequest.on('error', (error) => {
      console.error('[Metro API proxy] Backend no disponible:', error.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ exito: false, mensaje: 'El backend local no está disponible.' }));
    });

    req.pipe(apiRequest);
  };
};

module.exports = config;
