// Applies light or dark mode before the page paints (see src/lib/theme.ts).
(function () {
  var c = 'auto';
  try { c = localStorage.getItem('scene:theme') || 'auto'; } catch { /* blocked storage */ }
  var host = document.documentElement.getAttribute('data-theme');
  var dark = c === 'dark' || (c !== 'light' && (host === 'dark' || (host !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)));
  var t = dark ? 'dark' : 'light';
  document.documentElement.dataset.sceneTheme = t;
  document.documentElement.style.colorScheme = t;
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = dark ? '#17190F' : '#F4EFE6';
})();
