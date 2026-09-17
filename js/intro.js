/**
 * Retro balloon intro (overlay only).
 * Does not alter wedding card sections/data.
 */
(function () {
  const STORAGE_KEY = "geun-lim-intro-seen";
  const FLIGHT_MS = 4800;
  const ARRIVE_HOLD_MS = 800;
  const FADE_MS = 700;

  const root = document.getElementById("intro-balloon");
  if (!root) return;

  const skipBtn = root.querySelector(".intro__skip");
  const arrive = root.querySelector(".intro__arrive");
  const hint = root.querySelector(".intro__hint");
  const hudTop = root.querySelector(".intro__hud-top");
  const balloonWrap = root.querySelector(".intro__balloon-wrap");
  const barFill = root.querySelector(".intro__bar-fill");

  let holding = false;
  let started = false;
  let finished = false;
  let altitude = 0;
  let progress = 0;
  let startTs = 0;
  let rafId = 0;

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

  function setHolding(next) {
    if (finished) return;
    holding = next;
    if (next && !started) {
      started = true;
      startTs = performance.now();
      if (hint) hint.style.opacity = "0";
      balloonWrap?.classList.add("is-flying");
      rafId = requestAnimationFrame(tick);
    }
  }

  function renderVisual() {
    const lift = altitude * -42;
    if (balloonWrap) {
      balloonWrap.style.transform = `translate3d(0, ${lift}vh, 0)`;
    }
    if (barFill) {
      barFill.style.width = `${Math.min(100, progress * 100)}%`;
    }
  }

  function tick(now) {
    if (finished) return;

    const elapsed = now - startTs;
    const timeProgress = Math.min(1, elapsed / FLIGHT_MS);

    if (holding) {
      altitude = Math.min(1, altitude + 0.018);
      progress = Math.min(1, progress + 0.012);
    } else {
      altitude = Math.max(0.08, altitude - 0.01);
      progress = Math.min(1, progress + 0.004);
    }

    progress = Math.max(progress, timeProgress * 0.92);
    if (timeProgress >= 1) progress = 1;

    renderVisual();

    if (progress >= 1) {
      finishFlight();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function finishFlight() {
    if (finished) return;
    finished = true;
    holding = false;
    cancelAnimationFrame(rafId);

    altitude = Math.max(altitude, 0.72);
    progress = 1;
    renderVisual();

    if (hudTop) hudTop.style.opacity = "0";
    if (hint) hint.style.opacity = "0";
    arrive?.classList.add("is-visible");

    window.setTimeout(() => {
      closeIntro();
    }, ARRIVE_HOLD_MS);
  }

  function closeIntro() {
    markSeen();
    root.classList.add("is-leaving");
    window.setTimeout(() => {
      root.hidden = true;
      root.classList.remove("is-leaving");
      unlockScroll();
    }, FADE_MS);
  }

  function skipIntro(event) {
    event.preventDefault();
    event.stopPropagation();
    if (finished && root.classList.contains("is-leaving")) return;
    finished = true;
    cancelAnimationFrame(rafId);
    closeIntro();
  }

  function onPointerDown(event) {
    if (event.target.closest(".intro__skip")) return;
    if (finished) return;
    event.preventDefault();
    setHolding(true);
  }

  function onPointerUp() {
    setHolding(false);
  }

  function bind() {
    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    skipBtn?.addEventListener("click", skipIntro);
  }

  function startIntro() {
    if (alreadySeen()) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    lockScroll();
    bind();
    renderVisual();
  }

  window.startBalloonIntro = startIntro;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startIntro);
  } else {
    startIntro();
  }
})();
