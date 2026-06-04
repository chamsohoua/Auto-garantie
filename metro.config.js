const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs', 'cjs');

config.resolver.assetExts.push('glb', 'gltf', 'bin', 'hdr');

module.exports = config;