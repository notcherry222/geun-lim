/**
 * Pixel prologue: PNG cutscenes + one-tap flight.
 * Overlay only — does not alter wedding card body.
 */
(function () {
  const STORAGE_KEY = "geun-lim-intro-seen";
  const FADE_MS = 650;

  /** Timed cutscenes before TAP wait (ms from start) */
  const T = {
    meet: 1200,
    walk: 120,
    bang: 1550,
    heart: 2100,
    years: 4000,
    flightReady: 5800,
  };

  const FLY_MS = 1700;
  const FINAL_HOLD_MS = 1100;
  const EXIT_MS = 900;

  const root = document.getElementById("intro-balloon");
  if (!root) return;

  const skipBtn = root.querySelector(".intro__skip");
  const tapBtn = root.querySelector(".intro__tap");
  const ride = root.querySelector(".intro__ride");
  const flightBg = root.querySelector(".intro__flight-bg");

  const scenes = {
    title: root.querySelector(".intro__scene--title"),
    meet: root.querySelector(".intro__scene--meet"),
    years: root.querySelector(".intro__scene--years"),
    flight: root.querySelector(".intro__scene--flight"),
  };

  const timers = [];
  let finished = false;
  let awaitingTap = false;
  let flying = false;
  let rafId = 0;
  let flyStart = 0;

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
    while (timers.length) window.clearTimeout(timers.pop());
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
    awaitingTap = false;
    flying = false;
    cancelAnimationFrame(rafId);
    clearTimers();
    markSeen();
    root.classList.add("is-leaving");
    later(FADE_MS, () => {
      root.hidden = true;
      root.classList.remove("is-leaving");
      unlockScroll();
    });
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function setFlightTransforms(progress, exitExtra) {
    const p = Math.min(1, Math.max(0, progress));
    const e = exitExtra || 0;
    const lift = -(p * 42 + e * 55);
    const bob = flying && p < 1 ? Math.sin(performance.now() / 280) * 2.5 : 0;
    if (ride) {
      ride.style.transform = `translate3d(-50%, ${lift + bob}vh, 0)`;
    }
    if (flightBg) {
      flightBg.style.transform = `translate3d(0, ${(p + e) * 18}vh, 0) scale(${1 + (p + e) * 0.06})`;
    }
  }

  function flyTick(ts) {
    if (!flying || finished) return;
    if (!flyStart) flyStart = ts;
    const elapsed = ts - flyStart;
    const p = Math.min(1, elapsed / FLY_MS);
    setFlightTransforms(easeInOut(p), 0);

    if (p >= 0.55) {
      scenes.flight?.classList.add("is-final");
    }

    if (p < 1) {
      rafId = requestAnimationFrame(flyTick);
      return;
    }

    later(FINAL_HOLD_MS, () => {
      const exitStart = performance.now();
      function exitTick(now) {
        if (finished) return;
        const ep = Math.min(1, (now - exitStart) / EXIT_MS);
        setFlightTransforms(1, easeInOut(ep));
        if (ep < 1) {
          rafId = requestAnimationFrame(exitTick);
          return;
        }
        closeIntro();
      }
      rafId = requestAnimationFrame(exitTick);
    });
  }

  function startFlight() {
    if (!awaitingTap || flying || finished) return;
    awaitingTap = false;
    flying = true;
    flyStart = 0;

    scenes.flight?.classList.remove("is-ready");
    scenes.flight?.classList.add("is-flying");
    scenes.flight?.removeEventListener("pointerdown", onTapOnce);
    tapBtn?.removeEventListener("click", onTapOnce);

    rafId = requestAnimationFrame(flyTick);
  }

  function onTapOnce(event) {
    if (!awaitingTap || flying || finished) return;
    if (event.target.closest(".intro__skip")) return;
    event.preventDefault();
    event.stopPropagation();
    startFlight();
  }

  function showFlightReady() {
    showScene("flight");
    scenes.flight?.classList.add("is-ready");
    setFlightTransforms(0, 0);
    awaitingTap = true;
    scenes.flight?.addEventListener("pointerdown", onTapOnce);
    tapBtn?.addEventListener("click", onTapOnce);
  }

  function runCutscenes() {
    showScene("title");

    later(T.meet, () => {
      showScene("meet");
      later(T.walk, () => scenes.meet?.classList.add("is-walking"));
    });

    later(T.meet + T.bang, () => scenes.meet?.classList.add("is-bang"));
    later(T.meet + T.heart, () => {
      scenes.meet?.classList.remove("is-bang");
      scenes.meet?.classList.add("is-heart");
    });

    later(T.years, () => showScene("years"));
    later(T.flightReady, showFlightReady);
  }

  function onSkip(event) {
    event.preventDefault();
    event.stopPropagation();
    scenes.flight?.removeEventListener("pointerdown", onTapOnce);
    tapBtn?.removeEventListener("click", onTapOnce);
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
    runCutscenes();
  }

  window.startBalloonIntro = startIntro;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startIntro);
  } else {
    startIntro();
  }
})();
