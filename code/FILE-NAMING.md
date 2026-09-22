# Code filename versions

Current naming pass: 22 September 2026, version 01.

Website and artwork HTML, CSS and JavaScript files use `<name>-2026-09-22-v01.<extension>`. This date identifies the naming/reference update, not the original creation date. The suffix records the project file revision; it does not replace a third-party library's own release version.

Examples:
- Website: `index-2026-09-22-v01.html`
- Stage 3: `artworks/adapt/sketch-2026-09-22-v01.js`
- Website styles: `css/journey-2026-09-22-v01.css`

`index.html` files are stable compatibility redirects, preserving query strings and chapter hashes. Start the website through the same HTTP server and root URL as before.

For a later file revision, use the actual update date and increment that file's number (for example, `sketch-2026-09-23-v02.js`), updating its imports and links at the same time. This is an explicit naming convention, not an automatic rename-on-save feature.

`file-versions.json` records every old-to-new path. Current application files and the submission copy were updated. Historical source folders, archives, media assets, document filenames retain their existing names. Active test and build-tool filenames now also include the date and version; test names retain the .test.cjs ending for test discovery.

Verification: 86 automated checks pass. Browser smoke checks loaded the website shell, all four artwork canvases and the current design document, with no page errors or missing-resource responses.

Document files and their support files keep their original filenames. HTML reports and component-reference pages are also excluded from code version naming.
