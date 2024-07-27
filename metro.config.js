const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Adicione a extensão .cjs aos assetExts
defaultConfig.resolver.assetExts.push('cjs');

module.exports = defaultConfig;
