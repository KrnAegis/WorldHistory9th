(function () {
  "use strict";

  var TERMS = window.TERMS;
  var QUIZ_LENGTH = 25;
  var LETTERS = ["A", "B", "C", "D", "E"];

  // ---------- helpers ----------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function $(id) { return document.getElementById(id); }

  // Flatten every term's questions into one pool.
  var POOL = [];
  TERMS.forEach(function (term) {
    term.questions.forEach(function (q, i) {
      POOL.push({ key: term.id + ":" + i, termId: term.id, termName: term.name, q: q.q, answer: q.options[0], options: q.options, explain: q.explain });
    });
  });

  // ---------- routing ----------
  var VIEWS = ["learn", "flashcards", "quiz"];
  function route() {
    var hash = (location.hash || "#learn").slice(1);
    // Anything that isn't a view name (e.g. #term-xyz anchors) belongs to Learn.
    var view = VIEWS.indexOf(hash) >= 0 ? hash : "learn";
    document.querySelectorAll(".view").forEach(function (el) {
      el.hidden = el.getAttribute("data-view") !== view;
    });
    document.querySelectorAll(".tab").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-tab") === view);
    });
    if (VIEWS.indexOf(hash) >= 0) window.scrollTo(0, 0);
    else if (hash.indexOf("term-") === 0) {
      var target = $(hash);
      if (target) target.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", route);

  // ---------- learn ----------
  function renderLearn() {
    $("term-index").innerHTML = TERMS.map(function (t) {
      return '<li><a href="#term-' + t.id + '">' + esc(t.name) + "</a></li>";
    }).join("");

    $("term-entries").innerHTML = TERMS.map(function (t, i) {
      return (
        '<article class="entry" id="term-' + t.id + '">' +
          '<span class="entry__num" aria-hidden="true">' + pad(i + 1) + "</span>" +
          '<h3 class="entry__title">' + esc(t.name) + "</h3>" +
          '<p class="entry__tag">' + esc(t.tagline) + "</p>" +
          '<p class="entry__summary">' + esc(t.summary) + "</p>" +
          "<h4>Key things to know</h4>" +
          '<ul class="entry__points">' + t.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" +
          '<p class="entry__example"><strong>Real example</strong>' + esc(t.example) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  // ---------- flashcards ----------
  var deck = TERMS.slice();
  var fcIndex = 0;
  var card = $("flashcard");

  function renderCard(animate) {
    var t = deck[fcIndex];
    card.classList.remove("is-flipped");
    $("fc-front").textContent = t.name;
    $("fc-back").textContent = t.flashcard;
    $("fc-count").textContent = pad(fcIndex + 1) + " / " + pad(deck.length);
    $("fc-bar").style.transform = "scaleX(" + (fcIndex + 1) / deck.length + ")";
    $("fc-prev").disabled = fcIndex === 0;
    $("fc-next").textContent = fcIndex === deck.length - 1 ? "Start over ↺" : "Next →";
    if (animate) {
      card.classList.remove("is-swap");
      void card.offsetWidth;
      card.classList.add("is-swap");
    }
  }
  function nextCard() { fcIndex = (fcIndex + 1) % deck.length; renderCard(true); }
  function prevCard() { if (fcIndex > 0) { fcIndex--; renderCard(true); } }

  card.addEventListener("click", function () { card.classList.toggle("is-flipped"); });
  $("fc-next").addEventListener("click", nextCard);
  $("fc-prev").addEventListener("click", prevCard);
  $("fc-shuffle").addEventListener("click", function () { deck = shuffle(TERMS); fcIndex = 0; renderCard(true); });

  document.addEventListener("keydown", function (e) {
    if ($("view-flashcards").hidden) return;
    if (e.key === "ArrowRight") nextCard();
    else if (e.key === "ArrowLeft") prevCard();
    else if (e.key === " " && document.activeElement === document.body) { e.preventDefault(); card.classList.toggle("is-flipped"); }
  });

  // ---------- quiz ----------
  var quiz = null; // { questions, index, score, answers: [] }
  var root = $("quiz-root");

  // Pick 25 unique questions: one random question from every term first,
  // then fill the rest randomly from the remaining pool.
  function buildQuiz() {
    var chosen = [];
    var used = {};
    TERMS.forEach(function (term) {
      var options = POOL.filter(function (q) { return q.termId === term.id; });
      var pick = options[Math.floor(Math.random() * options.length)];
      chosen.push(pick);
      used[pick.key] = true;
    });
    var rest = shuffle(POOL.filter(function (q) { return !used[q.key]; }));
    chosen = chosen.concat(rest.slice(0, Math.max(0, QUIZ_LENGTH - chosen.length)));
    return shuffle(chosen).map(function (q) {
      return Object.assign({}, q, { shuffled: shuffle(q.options) });
    });
  }

  function startQuiz() {
    quiz = { questions: buildQuiz(), index: 0, score: 0, answers: [] };
    renderQuestion();
    window.scrollTo(0, 0);
  }

  function renderStart() {
    root.innerHTML =
      '<div class="quiz-start">' +
        '<p class="eyebrow">Part III</p>' +
        '<h2 class="section-title">Random Quiz</h2>' +
        '<p class="section-sub">Every quiz is different. You get instant feedback after each answer and your final score at the end.</p>' +
        '<div class="quiz-start__stats">' +
          "<div><strong>" + QUIZ_LENGTH + "</strong><span>Questions</span></div>" +
          "<div><strong>" + TERMS.length + "</strong><span>Terms covered</span></div>" +
          "<div><strong>" + POOL.length + "</strong><span>In question pool</span></div>" +
        "</div>" +
        '<button id="quiz-go" class="btn btn--red" type="button">Create random quiz</button>' +
        '<p class="quiz-start__note">Each quiz includes at least one question from every term, with no repeated questions.</p>' +
      "</div>";
    $("quiz-go").addEventListener("click", startQuiz);
  }

  function trackHtml() {
    return quiz.questions.map(function (_, i) {
      var cls = "quiz__pip";
      var a = quiz.answers[i];
      if (a) cls += a.correct ? " is-right" : " is-wrong";
      else if (i === quiz.index) cls += " is-current";
      return '<span class="' + cls + '"></span>';
    }).join("");
  }

  function renderQuestion() {
    var q = quiz.questions[quiz.index];
    root.innerHTML =
      '<div class="quiz">' +
        '<div class="quiz__bar">' +
          '<div class="quiz__track" aria-hidden="true">' + trackHtml() + "</div>" +
          '<span class="quiz__score" id="quiz-score">Score ' + quiz.score + " / " + quiz.answers.length + "</span>" +
        "</div>" +
        '<div class="qcard">' +
          '<div class="qcard__meta"><span class="mono">Question ' + (quiz.index + 1) + " of " + quiz.questions.length + '</span><span class="mono">' + esc(q.termName) + "</span></div>" +
          '<h3 class="qcard__q">' + esc(q.q) + "</h3>" +
          '<div class="options" role="group" aria-label="Answer choices">' +
            q.shuffled.map(function (opt, i) {
              return '<button class="option" type="button" data-i="' + i + '"><span class="option__key">' + LETTERS[i] + "</span><span>" + esc(opt) + "</span></button>";
            }).join("") +
          "</div>" +
          '<div id="quiz-feedback" aria-live="polite"></div>' +
        "</div>" +
      "</div>";

    root.querySelectorAll(".option").forEach(function (btn) {
      btn.addEventListener("click", function () { answer(Number(btn.getAttribute("data-i"))); });
    });
  }

  function answer(i) {
    if (quiz.answers[quiz.index]) return;
    var q = quiz.questions[quiz.index];
    var chosen = q.shuffled[i];
    var correct = chosen === q.answer;
    if (correct) quiz.score++;
    quiz.answers[quiz.index] = { correct: correct, chosen: chosen };

    root.querySelectorAll(".option").forEach(function (btn, idx) {
      var text = q.shuffled[idx];
      btn.disabled = true;
      if (text === q.answer) btn.classList.add("is-right");
      else if (idx === i) btn.classList.add("is-wrong");
      else btn.classList.add("is-dim");
    });

    var last = quiz.index === quiz.questions.length - 1;
    $("quiz-feedback").innerHTML =
      '<div class="feedback ' + (correct ? "feedback--right" : "feedback--wrong") + '">' +
        '<p class="feedback__head">' + (correct ? "✓ Correct!" : "✗ Not quite.") + "</p>" +
        (correct ? "" : "<p><strong>Correct answer:</strong> " + esc(q.answer) + "</p>") +
        "<p>" + esc(q.explain) + "</p>" +
      "</div>" +
      '<div class="qcard__next"><button id="quiz-next" class="btn btn--ink" type="button">' + (last ? "See my score →" : "Next question →") + "</button></div>";

    root.querySelector(".quiz__track").innerHTML = trackHtml();
    $("quiz-score").textContent = "Score " + quiz.score + " / " + quiz.answers.length;
    var next = $("quiz-next");
    next.focus({ preventScroll: true });
    next.addEventListener("click", function () {
      if (last) renderResults();
      else { quiz.index++; renderQuestion(); }
    });
  }

  function message(pct) {
    if (pct >= 90) return ["Outstanding!", "You've mastered this unit. You're ready for the test."];
    if (pct >= 80) return ["Great work!", "You know this material well. Review the few you missed below."];
    if (pct >= 70) return ["Good job!", "Solid start. Revisit the terms below and try another quiz."];
    if (pct >= 60) return ["Getting there.", "Re-read the weaker terms in the Learn section, then quiz again."];
    return ["Keep studying!", "Go back to the Learn section and flashcards, then try a new random quiz."];
  }

  function renderResults() {
    var total = quiz.questions.length;
    var pct = Math.round((quiz.score / total) * 100);
    var msg = message(pct);

    var byTerm = TERMS.map(function (t) {
      var r = 0, n = 0;
      quiz.questions.forEach(function (q, i) {
        if (q.termId === t.id) { n++; if (quiz.answers[i].correct) r++; }
      });
      return { name: t.name, right: r, total: n };
    });

    var missed = quiz.questions.map(function (q, i) { return { q: q, a: quiz.answers[i] }; })
      .filter(function (x) { return !x.a.correct; });

    root.innerHTML =
      '<div class="results">' +
        '<div class="results__top">' +
          '<div class="stamp"><div><strong>' + pct + '%</strong><span>' + quiz.score + " of " + total + " correct</span></div></div>" +
          "<div>" +
            '<p class="eyebrow">Final score</p>' +
            '<h2 class="results__title">' + msg[0] + "</h2>" +
            '<p class="results__msg">' + msg[1] + "</p>" +
            '<div class="results__actions">' +
              '<button id="quiz-again" class="btn btn--red" type="button">Create new random quiz</button>' +
              '<a class="btn btn--ghost" href="#learn">Review terms</a>' +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="breakdown"><h3>By term</h3>' +
          byTerm.map(function (b) {
            return '<div class="breakdown__row"><span>' + esc(b.name) + '</span><span class="breakdown__meter"><span style="width:' + (b.total ? (b.right / b.total) * 100 : 0) + '%"></span></span><span class="mono">' + b.right + "/" + b.total + "</span></div>";
          }).join("") +
        "</div>" +
        '<div class="review"><h3>' + (missed.length ? "Questions to review" : "Perfect score") + "</h3>" +
          (missed.length
            ? missed.map(function (x) {
                return '<div class="review__item">' +
                  '<p class="review__q">' + esc(x.q.q) + "</p>" +
                  '<p class="review__yours">Your answer: ' + esc(x.a.chosen) + "</p>" +
                  '<p class="review__right">Correct answer: ' + esc(x.q.answer) + "</p>" +
                  "<p>" + esc(x.q.explain) + "</p>" +
                "</div>";
              }).join("")
            : '<p class="review__empty">You didn\'t miss a single question. Nicely done.</p>') +
        "</div>" +
      "</div>";

    $("quiz-again").addEventListener("click", startQuiz);
    window.scrollTo(0, 0);
  }

  // ---------- init ----------
  renderLearn();
  renderCard(false);
  renderStart();
  route();
})();
