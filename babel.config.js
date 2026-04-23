/**
 * Babel configuration for REGEM Farm Track
 *
 * Plugins in order:
 * 1. module-resolver:  enables @/ path aliases
 * 2. nativewind/babel: transforms Tailwind className props
 *                      into React Native StyleSheet objects
 * 3. reanimated:       must always be listed LAST
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
      // Transforms className="..." into RN styles
      'nativewind/babel',
      // Must be last
      'react-native-reanimated/plugin',
    ],
  };
};