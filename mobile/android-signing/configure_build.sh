#!/bin/bash
BUILD_GRADLE="mobile/android/app/build.gradle"

# Add signingConfigs block just before buildTypes
perl -i -pe 'print "    signingConfigs {\n        release {\n            storeFile file(\"fridr.keystore\")\n            storePassword \"fridr2026!\"\n            keyAlias \"fridr\"\n            keyPassword \"fridr2026!\"\n        }\n    }\n" if /^\s*buildTypes \{/' "$BUILD_GRADLE"

# Add signingConfig to release block
perl -i -pe 'print "            signingConfig signingConfigs.release\n" if /^\s*release \{/' "$BUILD_GRADLE"

echo "Signing configured"
