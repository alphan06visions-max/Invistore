#!/bin/bash
set -e

BUILD_GRADLE="mobile/android/app/build.gradle"

# Strategy: We'll add signing config by modifying the android block properly.
# Expo generates a default build.gradle. We need to:
# 1. Add signingConfigs block inside android {}
# 2. Add signingConfig signingConfigs.release inside the release buildType

# Use a single perl script that processes the whole file
perl -0777 -i -pe '
  # Add signingConfigs block right before "buildTypes {"
  s/(\n\s*buildTypes\s*\{)/\n    signingConfigs {\n        release {\n            storeFile file("fridr.keystore")\n            storePassword "fridr2026!"\n            keyAlias "fridr"\n            keyPassword "fridr2026!"\n        }\n    }\n$1/;
  # Add signingConfig inside the release block (after "release {")
  s/(\brelease\s*\{)/$1\n            signingConfig signingConfigs.release/;
' "$BUILD_GRADLE"

echo "Signing configured in build.gradle"
