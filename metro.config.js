// Example for Metro (using expo/metro-config)
const path = require('path');

const {getDefaultConfig} = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const ALIASES = {
    tslib: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {

    if (moduleName.startsWith('@firebase/')) {
        return context.resolveRequest(
            {
                ...context,
                isESMImport: true, // Mark the import method as ESM
            },
            ALIASES[moduleName] ?? moduleName,
            platform
        );
    }
    return context.resolveRequest(
        context,
        ALIASES[moduleName] ?? moduleName,
        platform
    );
};

module.exports = config;