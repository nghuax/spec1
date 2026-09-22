import { getChapter, getChapterIndex, siteContent } from './content-2026-09-22-v01.js';
import { renderFooter, renderNavigation } from './navigation-2026-09-22-v01.js';
import { renderExhibition } from './exhibition-2026-09-22-v01.js';

function route(root, target) {
  return `${root}/${target}`;
}

function chapterHref(root, chapter) {
  return route(root, `works/${chapter.id}-2026-09-22-v01.html`);
}

function renderJourneyWord() {
  return siteContent.chapters
    .map(
      (chapter) => `
        <span class="journey-word__item journey-word__item--${chapter.id}">
          <span aria-hidden="true">${chapter.letter}</span>
          <span class="journey-word__name">${chapter.title}</span>
        </span>`
    )
    .join('<span class="journey-word__rule" aria-hidden="true"></span>');
}

function homeTypeField() {
  const [harm, exhaust, adapt, liven] = siteContent.chapters;
  return `
    <div class="type-field type-field--home" aria-hidden="true">
      <span class="type-field__word type-field__word--one">${harm.title}</span>
      <span class="type-field__word type-field__word--two">${exhaust.title}</span>
      <span class="type-field__word type-field__word--three">${adapt.title}</span>
      <span class="type-field__word type-field__word--four">${liven.title}</span>
      <span class="type-field__micro type-field__micro--one">${siteContent.project.eyebrow}</span>
      <span class="type-field__micro type-field__micro--two">DAMAGE / POLLUTION / TRANSITION / RECOVERY</span>
      <span class="type-field__micro type-field__micro--three">H — E — A — L</span>
      <span class="type-field__index">01<br>02<br>03<br>04</span>
    </div>`;
}

function chapterTypeField(chapter) {
  return `
    <div class="chapter-typefield" aria-hidden="true">
      <span class="chapter-typefield__word chapter-typefield__word--one">${chapter.title}</span>
      <span class="chapter-typefield__word chapter-typefield__word--two">${chapter.title}</span>
      <span class="chapter-typefield__word chapter-typefield__word--three">${chapter.title}</span>
      <span class="chapter-typefield__number">${chapter.number}</span>
      <span class="chapter-typefield__mood">${chapter.mood}</span>
      <span class="chapter-typefield__system">HEAL / ${chapter.letter} / ${chapter.number} OF 04</span>
    </div>`;
}

function renderHome() {
  const host = document.querySelector('[data-home-content]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  const chapters = siteContent.chapters
    .map(
      (chapter) => `
        <article class="chapter-panel chapter-panel--${chapter.id}" data-reveal>
          <div class="chapter-panel__topline">
            <span>${chapter.number} / 04</span>
            <span>${chapter.mood}</span>
          </div>
          <div class="chapter-panel__body">
            <div class="chapter-panel__letter" aria-hidden="true">${chapter.letter}</div>
            <div class="chapter-panel__copy">
              <h2>${chapter.title}</h2>
              <p>${chapter.statement}.</p>
              <a class="text-link" href="${chapterHref(root, chapter)}">
                EXPLORE ${chapter.title}<span aria-hidden="true"> →</span>
              </a>
            </div>
          </div>
          <div class="chapter-panel__typefield" aria-hidden="true">
            <span>${chapter.title}</span>
            <span>${chapter.title}</span>
            <span>${chapter.number}</span>
          </div>
          <div class="chapter-panel__geometry" aria-hidden="true"><span></span><span></span><span></span></div>
        </article>`
    )
    .join('');

  host.innerHTML = `
    <section class="hero" aria-labelledby="home-title">
      ${homeTypeField()}
      <div class="hero__meta">
        <p>${siteContent.project.eyebrow}</p>
        <p>FROM DAMAGE TO RECOVERY</p>
      </div>
      <h1 class="hero__title" id="home-title" aria-label="HEAL">
        <span>H</span><span>E</span><span>A</span><span>L</span>
      </h1>
      <div class="hero__bottom">
        <div class="hero__sequence" aria-label="HARM, EXHAUST, ADAPT, LIVEN">${renderJourneyWord()}</div>
        <a class="primary-link" href="${chapterHref(root, siteContent.chapters[0])}">
          ENTER THE JOURNEY <span aria-hidden="true">→</span>
        </a>
      </div>
      <div class="hero__signal" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </section>

    <section class="journey-intro" aria-labelledby="journey-heading">
      <p class="section-label">THE JOURNEY</p>
      <div>
        <h2 id="journey-heading">DAMAGE <span>→</span> POLLUTION <span>→</span> TRANSITION <span>→</span> RECOVERY</h2>
        <p>${siteContent.project.concept}</p>
      </div>
    </section>

    <section class="chapter-sequence" aria-label="HEAL chapters">${chapters}</section>

    <section class="home-about" data-reveal>
      <p class="section-label">THE WHOLE SYSTEM</p>
      <p>Four isolated interactive artworks. One connected environmental narrative.</p>
      <a class="text-link" href="${route(root, 'about-2026-09-22-v01.html')}">ABOUT HEAL <span aria-hidden="true">→</span></a>
    </section>`;
}

function progressMarkup(root, currentIndex) {
  return siteContent.chapters
    .map((chapter, index) => {
      const state = index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-current' : '';
      return `
        <li class="chapter-progress__item ${state}">
          <a href="${chapterHref(root, chapter)}" aria-label="${chapter.title}" ${index === currentIndex ? 'aria-current="step"' : ''}>
            <span class="chapter-progress__marker" aria-hidden="true"></span>
            <span class="chapter-progress__letter">${chapter.letter}</span>
            <span class="chapter-progress__name">${chapter.title}</span>
          </a>
        </li>`;
    })
    .join('');
}

function adjacentLink(root, chapter, direction) {
  if (!chapter && direction === 'previous') {
    return `<a class="chapter-nav__link chapter-nav__link--previous" href="${route(root, 'index-2026-09-22-v01.html')}">
      <span>PREVIOUS</span><strong>← HEAL</strong></a>`;
  }

  if (!chapter && direction === 'next') {
    return `<a class="chapter-nav__link chapter-nav__link--next" href="${route(root, 'about-2026-09-22-v01.html')}#call-to-action">
      <span>NEXT</span><strong>COMPLETE THE JOURNEY →</strong></a>`;
  }

  const arrow = direction === 'previous' ? '← ' : ' →';
  const label = direction === 'previous' ? `${arrow}${chapter.title}` : `${chapter.title}${arrow}`;
  return `<a class="chapter-nav__link chapter-nav__link--${direction}" href="${chapterHref(root, chapter)}">
    <span>${direction.toUpperCase()}</span><strong>${label}</strong></a>`;
}

function renderArtworkPage() {
  const host = document.querySelector('[data-artwork-content]');
  if (!host) return;

  const root = document.body.dataset.root || '..';
  const chapterId = document.body.dataset.chapter;
  const chapter = getChapter(chapterId);
  const index = getChapterIndex(chapterId);
  if (!chapter || index < 0) return;

  const previous = siteContent.chapters[index - 1];
  const next = siteContent.chapters[index + 1];
  const credit = chapter.credit
    ? `<p class="artwork-credit"><span>PROJECT CREDIT</span>${chapter.credit}</p>`
    : '';
  const goal = chapter.goal
    ? `<aside class="artwork-goal" aria-labelledby="artwork-goal-title">
        <div>
          <p class="section-label">YOUR GOAL</p>
          <h3 id="artwork-goal-title">${chapter.goal.title}</h3>
        </div>
        <ol>${chapter.goal.steps.map((step, stepIndex) => `<li><span>0${stepIndex + 1}</span>${step}</li>`).join('')}</ol>
      </aside>`
    : '';
  const context = chapter.context
    ? `<section class="artwork-context" aria-labelledby="artwork-context-title">
        <p class="section-label">${chapter.context.eyebrow}</p>
        <div>
          <h3 id="artwork-context-title">${chapter.context.title}</h3>
          <p>${chapter.context.body}</p>
          <div class="artwork-action">
            <p><span>TAKE ACTION</span>${chapter.context.action}</p>
            ${next ? `<a href="${chapterHref(root, next)}">CONTINUE TO ${next.title}<span aria-hidden="true"> →</span></a>` : ''}
          </div>
        </div>
      </section>`
    : '';
  const completion = chapter.id === 'adapt' && next
    ? `<aside class="artwork-completion" data-adapt-completion aria-labelledby="adapt-completion-title" hidden>
        <div>
          <p class="section-label">STAGE 3 COMPLETE</p>
          <h3 id="adapt-completion-title">A connected clean-energy network is ready.</h3>
          <p>Carry this transition into LIVEN and see life return to Earth.</p>
        </div>
        <a href="${chapterHref(root, next)}">CONTINUE TO LIVEN<span aria-hidden="true"> →</span></a>
      </aside>`
    : '';

  host.innerHTML = `
    <section class="chapter-masthead" aria-labelledby="chapter-title">
      ${chapterTypeField(chapter)}
      <div class="chapter-masthead__meta">
        <span>${chapter.number} / 04</span>
        <span>${chapter.mood}</span>
      </div>
      <div class="chapter-masthead__identity">
        <span class="chapter-masthead__letter" aria-hidden="true">${chapter.letter}</span>
        <div class="chapter-masthead__copy">
          <p>CHAPTER ${chapter.number}</p>
          <h1 id="chapter-title">${chapter.title}</h1>
          <p class="chapter-masthead__statement">${chapter.statement}.</p>
        </div>
      </div>
    </section>

    <nav class="chapter-progress" aria-label="Journey progress">
      <ol>${progressMarkup(root, index)}</ol>
    </nav>

    <section class="artwork-stage artwork-stage--${chapter.id}" aria-labelledby="artwork-heading">
      <div class="artwork-stage__topline">
        <h2 id="artwork-heading">INTERACTIVE ARTWORK</h2>
        <span>${chapter.id === 'adapt' ? 'RESPONSIVE / FULL COMPOSITION' : '16:9 / FULL COMPOSITION'}</span>
      </div>
      ${goal}
      <div class="artwork-frame" data-artwork-frame>
        <div class="artwork-loader" data-artwork-loader role="status">
          <span>LOADING ${chapter.title}</span>
          <span>${chapter.number} / 04</span>
          <div class="artwork-loader__line" aria-hidden="true"></div>
        </div>
        <iframe
          src="${route(root, chapter.artworkPath)}"
          title="${chapter.artworkTitle}"
          aria-describedby="artwork-description artwork-instructions"
          loading="eager"
          data-artwork-iframe></iframe>
        <div class="artwork-error" data-artwork-error hidden>
          <p>THE EXPERIENCE COULD NOT LOAD.</p>
          <button type="button" data-reload-artwork>RELOAD EXPERIENCE</button>
          <a href="${route(root, 'index-2026-09-22-v01.html')}">RETURN TO HEAL</a>
        </div>
      </div>
      ${completion}
      <p class="visually-hidden" id="artwork-description">${chapter.artworkDescription}</p>
      <div class="artwork-instructions" id="artwork-instructions">
        <p class="section-label">HOW TO INTERACT</p>
        <p>${chapter.instructions}</p>
      </div>
      ${context}
      ${credit}
    </section>

    <nav class="chapter-nav" aria-label="Adjacent chapters">
      ${adjacentLink(root, previous, 'previous')}
      ${adjacentLink(root, next, 'next')}
    </nav>`;

  setupArtworkFrame(host, chapter.title);
  if (chapter.id === 'adapt' && next) {
    setupAdaptCompletion(host, chapterHref(root, next));
  }
}

function setupAdaptCompletion(host, nextHref) {
  const iframe = host.querySelector('[data-artwork-iframe]');
  const completion = host.querySelector('[data-adapt-completion]');
  if (!iframe || !completion) return;

  // Only the embedded artwork on this origin can signal chapter completion.
  window.addEventListener('message', (event) => {
    if (event.source !== iframe.contentWindow || event.origin !== window.location.origin) return;
    const type = event.data && event.data.type;
    if (type === 'adapt:complete') {
      completion.hidden = false;
    } else if (type === 'adapt:reset') {
      completion.hidden = true;
    } else if (type === 'adapt:continue') {
      window.location.assign(nextHref);
    }
  });

  // Reloading an artwork starts a new field even after a completed visit.
  iframe.addEventListener('load', () => { completion.hidden = true; });
}

function setupArtworkFrame(host, chapterTitle) {
  const frame = host.querySelector('[data-artwork-frame]');
  const iframe = host.querySelector('[data-artwork-iframe]');
  const loader = host.querySelector('[data-artwork-loader]');
  const error = host.querySelector('[data-artwork-error]');
  const reload = host.querySelector('[data-reload-artwork]');
  let failureTimer;
  let hideTimer;

  function showLoaded() {
    window.clearTimeout(failureTimer);
    window.clearTimeout(hideTimer);
    error.hidden = true;
    frame.classList.add('is-loaded');
    frame.setAttribute('aria-busy', 'false');
    loader.setAttribute('aria-label', `${chapterTitle} loaded`);
    hideTimer = window.setTimeout(() => {
      loader.hidden = true;
    }, 450);
  }

  function showError() {
    window.clearTimeout(failureTimer);
    window.clearTimeout(hideTimer);
    frame.setAttribute('aria-busy', 'false');
    loader.hidden = true;
    error.hidden = false;
  }

  function startLoading() {
    window.clearTimeout(failureTimer);
    window.clearTimeout(hideTimer);
    error.hidden = true;
    loader.hidden = false;
    loader.removeAttribute('aria-label');
    frame.classList.remove('is-loaded');
    frame.setAttribute('aria-busy', 'true');
    failureTimer = window.setTimeout(showError, 18000);
  }

  iframe.addEventListener('load', showLoaded);
  iframe.addEventListener('error', showError);
  startLoading();
  reload.addEventListener('click', () => {
    startLoading();
    iframe.src = iframe.src;
  });
}

function chapterStageList(root) {
  return siteContent.chapters
    .map(
      (chapter) => `
        <li class="stage-list__item stage-list__item--${chapter.id}">
          <a href="${chapterHref(root, chapter)}">
            <span class="stage-list__number">${chapter.number}</span>
            <span class="stage-list__letter" aria-hidden="true">${chapter.letter}</span>
            <span class="stage-list__copy"><strong>${chapter.title}</strong><span>${chapter.statement}.</span></span>
            <span class="stage-list__arrow" aria-hidden="true">→</span>
          </a>
        </li>`
    )
    .join('');
}

function optionalAboutSections() {
  const { project } = siteContent;
  const sections = [];

  if (project.quote) {
    sections.push(`<section class="about-optional"><p class="section-label">GROUP QUOTE</p><blockquote>${project.quote}</blockquote></section>`);
  }
  if (project.callToAction) {
    sections.push(`<section class="about-optional" id="call-to-action"><p class="section-label">CALL TO ACTION</p><p>${project.callToAction}</p></section>`);
  }
  if (project.members.length) {
    const members = project.members.map((member) => `<li>${member}</li>`).join('');
    sections.push(`<section class="about-optional"><p class="section-label">GROUP MEMBERS</p><ul>${members}</ul></section>`);
  }
  if (project.credits.length) {
    const credits = project.credits.map((credit) => `<li>${credit}</li>`).join('');
    sections.push(`<section class="about-optional"><p class="section-label">CREDITS</p><ul>${credits}</ul></section>`);
  }

  return sections.join('');
}

function renderAbout() {
  const host = document.querySelector('[data-about-content]');
  if (!host) return;

  const root = document.body.dataset.root || '.';
  host.innerHTML = `
    <section class="about-hero" aria-labelledby="about-title">
      <div class="about-hero__typefield" aria-hidden="true">
        <span>HEAL</span><span>HEAL</span><span>HEAL</span>
        <i>DAMAGE / POLLUTION / TRANSITION / RECOVERY</i>
      </div>
      <p>${siteContent.project.eyebrow}</p>
      <h1 id="about-title">HEAL</h1>
      <p class="about-hero__tagline">FROM DAMAGE<br>TO RECOVERY</p>
      <div class="about-hero__word" aria-hidden="true">H — E — A — L</div>
    </section>

    <section class="about-concept" aria-labelledby="concept-title">
      <p class="section-label">THE CONCEPT</p>
      <div>
        <h2 id="concept-title">ONE JOURNEY.<br>FOUR STATES OF CHANGE.</h2>
        <p>${siteContent.project.concept}</p>
        <p>The experience begins with the consequences of conventional energy, moves through environmental exhaustion, introduces renewable adaptation, and concludes with renewed life.</p>
      </div>
    </section>

    <section class="about-stages" aria-labelledby="stages-title">
      <div class="about-stages__heading">
        <p class="section-label">THE FOUR STAGES</p>
        <h2 id="stages-title">HARM → EXHAUST → ADAPT → LIVEN</h2>
      </div>
      <ol class="stage-list">${chapterStageList(root)}</ol>
    </section>

    ${optionalAboutSections()}
    ${siteContent.project.callToAction ? '' : '<span id="call-to-action" class="anchor-target" aria-hidden="true"></span>'}

    <section class="visual-identity" aria-labelledby="identity-title">
      <div>
        <p class="section-label">VISUAL IDENTITY</p>
        <h2 id="identity-title">ONE PALETTE.<br>A CHANGING ATMOSPHERE.</h2>
      </div>
      <p>HEAL moves from charcoal, brown and industrial orange toward blue, purple, white and lime. Strong grids, sharp edges and editorial typography hold the four states together as one campaign.</p>
      <div class="palette" aria-label="HEAL colour palette">
        <span class="palette__swatch palette__swatch--ink"><i>#141414</i></span>
        <span class="palette__swatch palette__swatch--grey"><i>#9EA2A3</i></span>
        <span class="palette__swatch palette__swatch--white"><i>#FFFFFF</i></span>
        <span class="palette__swatch palette__swatch--blue"><i>#2033FF</i></span>
        <span class="palette__swatch palette__swatch--purple"><i>#6952EB</i></span>
        <span class="palette__swatch palette__swatch--orange"><i>#FE7D21</i></span>
        <span class="palette__swatch palette__swatch--lime"><i>#B3FF3B</i></span>
        <span class="palette__swatch palette__swatch--brown"><i>#643F28</i></span>
      </div>
    </section>

    <section class="system-documentation" aria-labelledby="documentation-title">
      <div class="system-documentation__heading">
        <p class="section-label">SYSTEM DOCUMENTATION</p>
        <h2 id="documentation-title">THE COMPONENTS AND TYPE THAT HOLD HEAL TOGETHER.</h2>
        <p>Two short visual reports explain how the shared interface is assembled and how Stack Sans Notch creates one voice across the four environmental states.</p>
      </div>

      <div class="documentation-grid">
        <article class="documentation-card documentation-card--components">
          <div class="documentation-card__visual documentation-components" aria-hidden="true">
            <div class="documentation-components__nav"><b>HEAL</b><span>H</span><span>E</span><span>A</span><span>L</span><i>ABOUT</i></div>
            <div class="documentation-components__panels"><i>H</i><i>E</i><i>A</i><i>L</i></div>
            <div class="documentation-components__frame"><span>INTERACTIVE ARTWORK</span><b>16:9</b></div>
          </div>
          <div class="documentation-card__copy">
            <span>REPORT 01 / WEBSITE SYSTEM</span>
            <h3>WEBSITE COMPONENTS</h3>
            <p>A pictorial guide to navigation, hero, chapter panels, progress, artwork frame, instructions, About sections and their source files.</p>
            <a class="text-link" href="${route(root, 'website-components.html')}">VIEW COMPONENT REPORT <span aria-hidden="true">→</span></a>
          </div>
        </article>

        <article class="documentation-card documentation-card--type">
          <div class="documentation-card__visual documentation-type" aria-hidden="true">
            <span>STACK SANS NOTCH / 200—700</span>
            <b>HEAL</b>
            <div><i>HARM</i><i>EXHAUST</i><i>ADAPT</i><i>LIVEN</i></div>
          </div>
          <div class="documentation-card__copy">
            <span>REPORT 02 / VISUAL IDENTITY</span>
            <h3>TYPOGRAPHY SYSTEM</h3>
            <p>The project typeface, hierarchy, responsive scale, tracking, weights, chapter treatments, accessibility and group consistency rules.</p>
            <a class="text-link" href="${route(root, 'typography-report.html')}">VIEW TYPOGRAPHY REPORT <span aria-hidden="true">→</span></a>
          </div>
        </article>
      </div>
    </section>

    <section class="credits" id="credits" aria-labelledby="credits-title">
      <p class="section-label">OPEN-SOURCE CODE / LICENCES</p>
      <div>
        <h2 id="credits-title">BUILT AS A STATIC INTERACTIVE EXHIBITION.</h2>
        <p>The site uses HTML, CSS, JavaScript and isolated p5-2026-09-22-v01.js artworks. Dependency notices and project licensing are included with the source.</p>
        <div class="credits__links">
          <a class="text-link" href="${route(root, 'THIRD-PARTY-LICENSES.md')}">THIRD-PARTY LICENCES <span aria-hidden="true">→</span></a>
          <a class="text-link" href="${route(root, 'LICENSE')}">GPL-3.0 LICENCE <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>`;
}

function setupReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  elements.forEach((element) => {
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
}

function init() {
  renderNavigation();
  renderFooter();
  if (document.body.hasAttribute('data-exhibition')) {
    renderExhibition();
    return;
  }
  renderHome();
  renderArtworkPage();
  renderAbout();
  setupReveal();
}

init();

