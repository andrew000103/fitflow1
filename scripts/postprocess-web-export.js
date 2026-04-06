const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const webBundleDir = path.join(distDir, '_expo', 'static', 'js', 'web');

const oldFontPath = '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';
const newFontPath = '/assets/expo-vector-icons/Fonts/';

const sourceFontDir = path.join(
  distDir,
  'assets',
  'node_modules',
  '@expo',
  'vector-icons',
  'build',
  'vendor',
  'react-native-vector-icons',
  'Fonts'
);
const targetFontDir = path.join(distDir, 'assets', 'expo-vector-icons', 'Fonts');
const redirectsFilePath = path.join(distDir, '_redirects');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFonts() {
  if (!fs.existsSync(sourceFontDir)) return;
  ensureDir(targetFontDir);

  for (const fileName of fs.readdirSync(sourceFontDir)) {
    const sourceFile = path.join(sourceFontDir, fileName);
    const targetFile = path.join(targetFontDir, fileName);
    if (fs.statSync(sourceFile).isFile()) {
      fs.copyFileSync(sourceFile, targetFile);
    }
  }
}

function rewriteWebBundles() {
  if (!fs.existsSync(webBundleDir)) return;

  for (const fileName of fs.readdirSync(webBundleDir)) {
    if (!fileName.endsWith('.js')) continue;

    const bundlePath = path.join(webBundleDir, fileName);
    const original = fs.readFileSync(bundlePath, 'utf8');
    if (!original.includes(oldFontPath)) continue;

    const rewritten = original.split(oldFontPath).join(newFontPath);
    fs.writeFileSync(bundlePath, rewritten);
  }
}

function writeSpaRedirects() {
  if (!fs.existsSync(distDir)) return;

  const redirectsContent = '/* /index.html 200\n';
  fs.writeFileSync(redirectsFilePath, redirectsContent);
}

copyFonts();
rewriteWebBundles();
writeSpaRedirects();
