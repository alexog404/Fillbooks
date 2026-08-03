// Runs before paint (via next/script's beforeInteractive-equivalent inline
// placement in <head>) to apply the persisted theme class before React
// hydrates -- avoids a flash of the wrong theme on load.
const THEME_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem('fillbooks-theme') || 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    var cb = localStorage.getItem('fillbooks-colorblind') === '1';
    if (cb) document.documentElement.classList.add('colorblind');
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
