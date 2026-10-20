/**
 * Site-wide behaviour: the sticky header's state, the small-screen menu, the
 * search dialog and gentle reveals. Everything degrades to plain links and
 * visible content without JavaScript.
 */
import { loadIndex, renderHits, search, statusText } from './search';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------ Header */

const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const update = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* -------------------------------------------------------------- Menu */

const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
document.querySelectorAll('[data-menu-open]').forEach((btn) =>
  btn.addEventListener('click', () => {
    menu?.showModal();
    btn.setAttribute('aria-expanded', 'true');
  }),
);
menu?.addEventListener('close', () =>
  document.querySelectorAll('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false')),
);
menu?.querySelectorAll('[data-menu-close]').forEach((btn) => btn.addEventListener('click', () => menu.close()));
// Close the menu when following an in-page link.
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu.close()));

/* ------------------------------------------------------------ Search */

const dialog = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]');
const results = dialog?.querySelector<HTMLElement>('[data-search-results]');
const status = dialog?.querySelector<HTMLElement>('[data-search-status]');

function openSearch() {
  if (!dialog || !input) return;
  if (menu?.open) menu.close();
  dialog.showModal();
  input.focus();
  input.select();
  loadIndex().catch(() => {
    if (status) status.textContent = 'Search is unavailable at the moment.';
  });
}

document.querySelectorAll<HTMLAnchorElement>('[data-search-open]').forEach((a) =>
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    openSearch();
  }),
);

dialog?.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

// In a search field, Escape would first clear the text; here it closes the dialog.
input?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    dialog?.close();
  }
});

let pending = 0;
input?.addEventListener('input', () => {
  window.clearTimeout(pending);
  pending = window.setTimeout(async () => {
    const q = input.value;
    try {
      const entries = await loadIndex();
      const hits = search(entries, q, 30);
      if (results) renderHits(results, hits, q);
      if (status) status.textContent = statusText(hits.length, q);
    } catch {
      if (status) status.textContent = 'Search is unavailable at the moment.';
    }
  }, 90);
});

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  const typing = target.closest('input, textarea, select, [contenteditable="true"]');
  if (e.key === '/' && !typing && !dialog?.open) {
    e.preventDefault();
    openSearch();
  }
});

/* ----------------------------------------------------------- Reveals */

const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealables.forEach((el) => io.observe(el));
}
