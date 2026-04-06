const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const webBundleDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const indexHtmlPath = path.join(distDir, 'index.html');

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
const spaNotFoundPath = path.join(distDir, '404.html');
const sharedLevelTestDir = path.join(distDir, 'shared', 'level-test');
const sharedLevelTestIndexPath = path.join(sharedLevelTestDir, 'index.html');
const sharedOgImageSourcePath = path.join(
  projectRoot,
  'assets',
  'pixel',
  'female',
  'white',
  'w_lv5.png'
);
const sharedOgImageDir = path.join(distDir, 'og');
const sharedOgImageFileName = 'health-level-test-share.png';
const sharedOgImageOutputPath = path.join(sharedOgImageDir, sharedOgImageFileName);

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

function getConfiguredWebUrl() {
  const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (!configuredWebUrl) return '';

  try {
    const parsed = new URL(configuredWebUrl);
    return normalizeBaseUrl(parsed.toString());
  } catch {
    return '';
  }
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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

function writeSpaFallbackFiles() {
  if (!fs.existsSync(indexHtmlPath)) return;

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  fs.writeFileSync(spaNotFoundPath, indexHtml);

  ensureDir(sharedLevelTestDir);
  fs.writeFileSync(sharedLevelTestIndexPath, indexHtml);
}

function copySharedOgImage() {
  if (!fs.existsSync(sharedOgImageSourcePath)) return null;

  ensureDir(sharedOgImageDir);
  fs.copyFileSync(sharedOgImageSourcePath, sharedOgImageOutputPath);

  return `/${path.posix.join('og', sharedOgImageFileName)}`;
}

function buildSharedLevelTestHeadMarkup(ogImagePath) {
  const normalizedBaseUrl = getConfiguredWebUrl();
  const canonicalPath = '/shared/level-test';
  const canonicalUrl = normalizedBaseUrl ? `${normalizedBaseUrl}${canonicalPath}` : canonicalPath;
  const ogImageUrl = normalizedBaseUrl && ogImagePath ? `${normalizedBaseUrl}${ogImagePath}` : ogImagePath;
  const title = '나의 헬스 레벨은 어디쯤일까? | fit';
  const description =
    '픽셀 캐릭터와 함께 나의 헬스 레벨을 확인해보세요. 몇 가지 질문만 답하면 테스트 결과를 바로 볼 수 있어요.';
  const tags = [
    `<meta name="description" content="${escapeHtmlAttribute(description)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="fit" />',
    `<meta property="og:title" content="${escapeHtmlAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttribute(description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttribute(canonicalUrl)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtmlAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttribute(description)}" />`,
  ];

  if (ogImageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtmlAttribute(ogImageUrl)}" />`);
    tags.push('<meta property="og:image:width" content="1200" />');
    tags.push('<meta property="og:image:height" content="1200" />');
    tags.push(
      '<meta property="og:image:alt" content="핏플로우 헬스 레벨 테스트 대표 픽셀 캐릭터 이미지" />'
    );
    tags.push(`<meta name="twitter:image" content="${escapeHtmlAttribute(ogImageUrl)}" />`);
  }

  return tags.join('\n    ');
}

function writeSharedLevelTestOgPage() {
  if (!fs.existsSync(sharedLevelTestIndexPath)) return;

  const sharedRouteHtml = fs.readFileSync(sharedLevelTestIndexPath, 'utf8');
  const ogImagePath = copySharedOgImage();
  const headMarkup = buildSharedLevelTestHeadMarkup(ogImagePath);
  const titlePattern = /<title>[\s\S]*?<\/title>/i;
  const withUpdatedTitle = titlePattern.test(sharedRouteHtml)
    ? sharedRouteHtml.replace(titlePattern, `<title>나의 헬스 레벨은 어디쯤일까? | fit</title>`)
    : sharedRouteHtml;
  const nextHtml = withUpdatedTitle.replace('</head>', `    ${headMarkup}\n  </head>`);

  fs.writeFileSync(sharedLevelTestIndexPath, nextHtml);
}

copyFonts();
rewriteWebBundles();
writeSpaRedirects();
writeSpaFallbackFiles();
writeSharedLevelTestOgPage();
