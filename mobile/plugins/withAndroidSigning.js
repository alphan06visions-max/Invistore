const { withAppBuildGradle } = require("@expo/config-plugins");

const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      /buildTypes\s*\{/,
      `signingConfigs {
        release {
            storeFile file("fridr.keystore")
            storePassword "fridr2026!"
            keyAlias "fridr"
            keyPassword "fridr2026!"
        }
    }
    buildTypes {`
    );

    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      /(\brelease\s*\{)/,
      `$q
            signingConfig signingConfigs.release`
    );

    return modConfig;
  });
};

module.exports = withAndroidSigning;
