const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  if (!content.includes('!x.startsWith("node:")')) {
    content = content.replace(
      '.filter((x)=>!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x)',
      '.filter((x)=>!x.startsWith("node:") && !x.includes(":") && !/^_|^(internal|v8|node-inspect)\\/|\\//.test(x)'
    );
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-expo] Patched @expo/cli externals.js for Windows Node compatibility.');
  }
}
