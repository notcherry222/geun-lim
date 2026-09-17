/**
 * Pixel prologue cutscene (overlay only).
 * Does not alter wedding card sections/data.
 */
(function () {
  const STORAGE_KEY = "geun-lim-intro-seen";
  const FADE_MS = 550;

  // Timed cutscene (~5s total)
  const T = {
    title: 0,
    meet: 1000,
    walk: 1100,
    bang: 2300,
    heart: 2550,
    years: 2800,
    flight: 3700,
    lift: 3850,
    end: 5200,
  };

  const root = document.getElementById("intro-balloon");
  if (!root) return;

  const skipBtn = root.querySelector(".intro__skip");
  const scenes = {
    title: root.querySelector(".intro__scene--title"),
    meet: root.querySelector(".intro__scene--meet"),
    years: root.querySelector(".intro__scene--years"),
    flight: root.querySelector(".intro__scene--flight"),
  };

  const timers = [];
  let finished = false;

  function alreadySeen() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function markSeen() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      /* ignore */
    }
  }

  function lockScroll() {
    document.body.classList.add("is-locked");
  }

  function unlockScroll() {
    document.body.classList.remove("is-locked");
  }

  function clearTimers() {
    while (timers.length) {
      window.clearTimeout(timers.pop());
    }
  }

  function later(ms, fn) {
    timers.push(window.setTimeout(fn, ms));
  }

  function showScene(name) {
    Object.keys(scenes).forEach((key) => {
      scenes[key]?.classList.toggle("is-active", key === name);
    });
  }

  function closeIntro() {
    if (finished) return;
    finished = true;
    clearTimers();
    markSeen();
    root.classList.add("is-leaving");
    later(FADE_MS, () => {
      root.hidden = true;
      root.classList.remove("is-leaving");
      unlockScroll();
    });
  }

  function runSequence() {
    showScene("title");

    later(T.meet, () => {
      showScene("meet");
    });

    later(T.walk, () => {
      scenes.meet?.classList.add("is-walking");
    });

    later(T.bang, () => {
      scenes.meet?.classList.add("is-bang");
    });

    later(T.heart, () => {
      scenes.meet?.classList.add("is-heart");
    });

    later(T.years, () => {
      showScene("years");
    });

    later(T.flight, () => {
      showScene("flight");
    });

    later(T.lift, () => {
      scenes.flight?.classList.add("is-lift");
    });

    later(T.end, () => {
      closeIntro();
    });
  }

  function onSkip(event) {
    event.preventDefault();
    event.stopPropagation();
    closeIntro();
  }

  function startIntro() {
    if (alreadySeen()) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    lockScroll();
    skipBtn?.addEventListener("click", onSkip);
    runSequence();
  }

  window.startBalloonIntro = startIntro;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startIntro);
  } else {
    startIntro();
  }
})();
