const fs = require('fs');

const p = 'mobile/android/app/build.gradle';
let lines = fs.readFileSync(p, 'utf8').split('\n');
const out = [];

let inAndroid = false;
let addedSigningConfigs = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);
  
  // Detect "android {" line
  if (/^\s*android\s*\{/.test(line)) {
    inAndroid = true;
  }
  
  // Right before "buildTypes {" inside android block, insert signingConfigs
  if (inAndroid && /^\s*buildTypes\s*\{/.test(line) && !addedSigningConfigs) {
    // Insert signingConfigs block before this line (go back and splice)
    const indent = line.match(/^(\s*)/)[1];
    const signBlock = [
      '',
      indent + 'signingConfigs {',
      indent + '    release {',
      indent + '        storeFile file("fridr.keystore")',
      indent + '        storePassword "fridr2026!"',
      indent + '        keyAlias "fridr"',
      indent + '        keyPassword "fridr2026!"',
      indent + '    }',
      indent + '}',
    ];
    // Insert before the current line (which is already added)
    out.splice(out.length - 1, 0, ...signBlock);
    addedSigningConfigs = true;
  }
  
  // Inside release buildType, add signingConfig
  if (inAndroid && /^\s*release\s*\{/.test(line)) {
    const indent = line.match(/^(\s*)/)[1];
    out.push(indent + '    signingConfig signingConfigs.release');
  }
}

fs.writeFileSync(p, out.join('\n'));
console.log('Signing configured successfully');
