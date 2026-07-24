const { withAppBuildGradle } = require("@expo/config-plugins");

const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // 1. Insert release block INSIDE the signingConfigs block, right after the debug block
    // We find the closing } of the debug block inside signingConfigs and insert release after it
    contents = contents.replace(
      /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?}\s*)(})/,
      `$1    release {
            storeFile file("fridr.keystore")
            storePassword "fridr2026!"
            keyAlias "fridr"
            keyPassword "fridr2026!"
        }
    $2`
    );

    // 2. In the release buildType, change signingConfigs.debug to signingConfigs.release
    // Target only the release block inside buildTypes
    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );

    modConfig.modResults.contents = contents;
    return modConfig;
  });
};

module.exports = withAndroidSigning;
