# Empire & Nation — Nationalism & Imperialism Study Guide

A study guide for a 9th grade New Jersey World History unit on nationalism and imperialism. It covers eighteen study entries in three sections:

- **Learn**: plain-language explanations of each term, with key points and a real example.
- **Flashcards**: a flip-card deck with one card per term. You can shuffle it and use the keyboard (Space flips, ← / → move between cards).
- **Quiz**: press **Create random quiz** to get 25 questions drawn from a pool of 61. Every quiz has at least one question per term and never repeats a question. Each answer is marked right or wrong straight away with a short explanation. At the end you see your score, a breakdown by term, and the questions you missed.

Terms: Nationalism, Liberalism, Conservatives, Radical, Patriotism, Imperialism, Social Darwinism, Paternalism, Assimilation, Colonies, Protectorate, Sphere of Influence, Western Advantages, Political Ideas & Causes, Imperialism in the Congo, Scramble for Africa, Nationalism vs. Imperialism vs. Patriotism, Implications of Nationalism & Imperialism.

## Technology

It is a static site built with plain HTML, CSS, and JavaScript, with no build step and no dependencies. Fonts come from Google Fonts (Fraunces, Literata, IBM Plex Mono). It is hosted on Netlify.

## Running locally

Serve the folder with any static server, for example:

```bash
npx serve .
# or
netlify dev --port 8889
```

## Editing content

All study content lives in `js/data.js`. To add a question, add an entry to a term's `questions` array and put the **correct answer first** in `options`. The app shuffles the answer order whenever it builds a quiz.
