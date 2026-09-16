import { siteContent } from './content.js';
import { stages } from './exhibition-content.js';

function route(root, target) {
  return `${root}/${target}`;
}

function chapterLink(chapter, root, currentChapter) {
  const isCurrent = chapter.id === currentChapter;
  const exhibition = document.body.hasAttribute('data-exhibition');
  const before = exhibition && stages.findIndex(s => s.id === chapter.id) < stages.findIndex(s => s.id === currentChapter);
  return `
    <a class="site-nav__chapter ${exhibition ? 'exhibition-progress' : ''} ${before ? 'is-before' : ''}" href="${route(root, `works/${chapter.id}.html`)}"
      ${exhibition ? `aria-label="Stage ${chapter.number}: ${chapter.title}" title="${chapter.title}"` : ''}
      ${isCurrent ? 'aria-current="page"' : ''}>
      <span class="site-nav__letter" aria-hidden="true">${exhibition ? chapter.number : chapter.letter}</span>
      <span class="site-nav__name">${chapter.title}</span>
    </a>`;
}

export function renderNavigation() {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  const currentChapter = document.body.dataset.chapter || '';
  const page = document.body.dataset.page || '';
  const exhibition = document.body.hasAttribute('data-exhibition');
  const links = (exhibition ? stages : siteContent.chapters)
    .map((chapter) => chapterLink(chapter, root, currentChapter))
    .join('');

  host.innerHTML = `
    <nav class="site-nav" aria-label="Primary navigation">
      <a class="site-nav__brand" href="${route(root, 'index.html')}" aria-label="HEAL home">HEAL</a>
      <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="mobile-navigation">
        <span class="site-nav__toggle-label">MENU</span>
        <span class="site-nav__toggle-mark" aria-hidden="true"></span>
      </button>
      <div class="site-nav__links" id="mobile-navigation">
        <div class="site-nav__journey" aria-label="${exhibition ? 'Project stage progress' : 'HEAL chapters'}">${links}</div>
        <a class="site-nav__about" href="${route(root, 'about.html')}"
          ${page === 'about' ? 'aria-current="page"' : ''}>ABOUT</a>
      </div>
    </nav>`;

  const toggle = host.querySelector('.site-nav__toggle');
  const menu = host.querySelector('.site-nav__links');
  const label = host.querySelector('.site-nav__toggle-label');
  const background = [...document.querySelectorAll('main, [data-site-footer], .skip-link')];
  const inertBeforeOpen = new Map();

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-is-open', open);
    label.textContent = open ? 'CLOSE' : 'MENU';
    background.forEach((element) => {
      if (open) {
        if (!inertBeforeOpen.has(element)) inertBeforeOpen.set(element, element.inert);
        element.inert = true;
      } else if (inertBeforeOpen.has(element)) {
        element.inert = inertBeforeOpen.get(element);
        inertBeforeOpen.delete(element);
      }
    });
  }

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      setMenu(false);
      toggle.focus();
    } else if (event.key === 'Tab') {
      const controls = [...host.querySelectorAll('a, button')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 840px)');
  desktopQuery.addEventListener('change', (event) => {
    const focused = document.activeElement;
    setMenu(false);
    if (event.matches && focused === toggle) host.querySelector('.site-nav__brand').focus();
    if (!event.matches && menu.contains(focused)) toggle.focus();
  });
}

export function renderFooter() {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  host.innerHTML = `
    <div class="site-footer__identity">
      <span>${document.body.hasAttribute('data-exhibition') ? 'HEAL / DAMAGE TO RECOVERY' : 'HEAL'}</span>
      <span>COMM2754</span>
      <span>RMIT UNIVERSITY VIETNAM</span>
      <span>2026</span>
    </div>
    <a href="${route(root, 'about.html')}#credits">CREDITS</a>`;
}
