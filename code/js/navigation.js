import { siteContent } from './content.js';

function route(root, target) {
  return `${root}/${target}`;
}

function chapterLink(chapter, root, currentChapter) {
  const isCurrent = chapter.id === currentChapter;
  return `
    <a class="site-nav__chapter" href="${route(root, `works/${chapter.id}.html`)}"
      ${isCurrent ? 'aria-current="page"' : ''}>
      <span class="site-nav__letter" aria-hidden="true">${chapter.letter}</span>
      <span class="site-nav__name">${chapter.title}</span>
    </a>`;
}

export function renderNavigation() {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  const currentChapter = document.body.dataset.chapter || '';
  const page = document.body.dataset.page || '';
  const links = siteContent.chapters
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
        <div class="site-nav__journey" aria-label="HEAL chapters">${links}</div>
        <a class="site-nav__about" href="${route(root, 'about.html')}"
          ${page === 'about' ? 'aria-current="page"' : ''}>ABOUT</a>
      </div>
    </nav>`;

  const toggle = host.querySelector('.site-nav__toggle');
  const menu = host.querySelector('.site-nav__links');
  const label = host.querySelector('.site-nav__toggle-label');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-is-open', open);
    label.textContent = open ? 'CLOSE' : 'MENU';
  }

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 840px)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}

export function renderFooter() {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  host.innerHTML = `
    <div class="site-footer__identity">
      <span>HEAL</span>
      <span>COMM2748</span>
      <span>RMIT UNIVERSITY VIETNAM</span>
      <span>2026</span>
    </div>
    <a href="${route(root, 'about.html')}#credits">CREDITS</a>`;
}
