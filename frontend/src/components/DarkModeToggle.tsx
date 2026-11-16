import { useDarkMode } from '../hooks/useDarkMode';

export function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true" className="text-lg">
        {dark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
