# AGENTS.md

## Architecture
This is a static single-page app with no framework, no bundler, and no backend. Netlify publishes the repo root (`netlify.toml` sets `publish = "."`).

- `index.html` is the page shell with three views (`learn`, `flashcards`, `quiz`), switched by the URL hash (`#learn`, `#flashcards`, `#quiz`). Any other hash, such as the `#term-<id>` anchors, shows the Learn view.
- `js/data.js` sets `window.TERMS`, the single source of all content. Each term has `id`, `name`, `tagline`, `summary`, `points[]`, `example`, `flashcard`, and `questions[]`.
- `js/app.js` is a vanilla JS IIFE that renders all three views.
- `css/styles.css` holds all styles. The "antique atlas" theme is defined by CSS variables in `:root`.

## Conventions and non-obvious decisions
- **Correct answer = `options[0]`** in `data.js`. Option order is shuffled each time a quiz is built, and answers are checked by comparing text, so all options within a question must be unique.
- **Quiz building** (`buildQuiz` in `app.js`): pick one random question per term, fill up to `QUIZ_LENGTH` (25) from the rest of the pool with no repeats, then shuffle. The pool must hold at least 25 questions, and every term needs at least one.
- **Reading level**: content is written for 9th grade (New Jersey World History). Keep the language simple and concrete.
- There is no persistence. Quiz state lives only in memory for the current page view, which is intentional.
- Do not add a build step unless a real need comes up.
