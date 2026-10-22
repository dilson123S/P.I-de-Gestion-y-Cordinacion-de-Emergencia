// Configuración de Babel para Expo con soporte de enrutamiento basado en archivos
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'],
  };
};
