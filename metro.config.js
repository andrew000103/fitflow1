const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// zustand ships ESM files that use `import.meta.env` (Vite idiom).
// Metro bundles everything into one script (not ES modules), so the browser
// throws "Cannot use 'import.meta' outside a module".
// Fix: on web, redirect zustand imports to their CJS builds.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('zustand')) {
    const cjsName = moduleName.replace(/^zustand(\/(.+))?$/, (_, _full, sub) =>
      sub ? path.join(__dirname, 'node_modules/zustand', sub + '.js') : path.join(__dirname, 'node_modules/zustand/index.js')
    );
    return { type: 'sourceFile', filePath: cjsName };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
