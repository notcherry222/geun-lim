/**
 * Pixel prologue: cutscenes + tap-to-fly mini-game.
 * Overlay only — does not alter wedding card body.
 */
(function () {
  const STORAGE_KEY = "geun-lim-intro-seen";
  const FADE_MS = 600;
  const TAPS_TO_CLEAR = 6.5;
  const TAP_BOOST = 0.13;
  const GRAVITY = 0.00055;
  const DRAG = 0.965;
  const MAX_VEL = 0.055;
  const ARRIVE_HOLD_MS = 1100;

  const T = {
    meet: 1200,
    walk: 1300,
    bang: 2700,
    heart: 3000,
    holdMeet: 3500,
    years: 3600,
    dusk: 4200,
    night: 4800,
    flight: 5600,
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

  const ride = root.querySelector(".intro__ride");
  const gaugeFill = root.querySelector(".intro__gauge-fill");
  const sky = root.querySelector(".intro__sky");
  const citySil = root.querySelector(".intro__city-sil");
  const clouds = root.querySelectorAll(".intro__cloud");

  const timers = [];
  let finished = false;
  let inFlight = false;
  let inputLocked = false;
  let altitude = 0;
  let velocity = 0;
  let progress = 0;
  let rafId = 0;
  let lastTs = 0;

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
    inFlight = false;
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

  function renderFlight() {
    const liftPx = altitude * -58;
    if (ride) {
      const bob = Math.sin(performance.now() / 320) * (1.2 + (1 - progress) * 1.5);
      ride.style.transform = `translate3d(0, ${liftPx + bob}vh, 0)`;
    }
    if (gaugeFill) gaugeFill.style.width = `${Math.min(100, progress * 100)}%`;
    if (sky) sky.style.transform = `translate3d(0, ${altitude * 18}vh, 0)`;
    if (citySil) citySil.style.transform = `translate3d(0, ${altitude * 28}vh, 0)`;

    clouds.forEach((cloud, i) => {
      const depth = i < 2 ? 12 : i < 4 ? 22 : 36;
      const drift = altitude * depth;
      const base = cloud.dataset.baseX || "0";
      cloud.style.transform = `translate3d(${base}px, ${drift}vh, 0)`;
    });
  }

  function flightTick(ts) {
    if (!inFlight || finished) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(32, ts - lastTs);
    lastTs = ts;

    if (!inputLocked) {
      velocity -= GRAVITY * dt;
      velocity *= Math.pow(DRAG, dt / 16);
      if (velocity > MAX_VEL) velocity = MAX_VEL;
      if (velocity < -MAX_VEL * 0.45) velocity = -MAX_VEL * 0.45;

      altitude += velocity * (dt / 16);
      if (altitude < 0) {
        altitude = 0;
        velocity = Math.max(0, velocity);
      }
      if (altitude > 1.15) altitude = 1.15;

      progress = Math.max(progress, Math.min(1, altitude / 0.92));
    } else {
      velocity = Math.max(velocity, 0.028);
      altitude += velocity * (dt / 16);
      progress = 1;
    }

    renderFlight();

    if (!inputLocked && progress >= 1) {
      beginArrival();
    }

    if (inputLocked && altitude > 1.35) {
      closeIntro();
      return;
    }

    rafId = requestAnimationFrame(flightTick);
  }

  function onTap(event) {
    if (!inFlight || inputLocked || finished) return;
    if (event.target.closest(".intro__skip")) return;
    event.preventDefault();

    scenes.flight?.classList.add("is-playing");
    velocity += TAP_BOOST;
    if (velocity > MAX_VEL) velocity = MAX_VEL;
    altitude += 0.035;
    progress = Math.min(1, progress + 1 / (TAPS_TO_CLEAR * 1.15));
    renderFlight();
  }

  function beginArrival() {
    if (inputLocked) return;
    inputLocked = true;
    progress = 1;
    scenes.flight?.classList.add("is-arrived");
    velocity = 0.02;
    later(ARRIVE_HOLD_MS, () => {
      velocity = 0.04;
    });
  }

  function startFlight() {
    showScene("flight");
    inFlight = true;
    inputLocked = false;
    altitude = 0.02;
    velocity = 0.008;
    progress = 0;
    lastTs = 0;
    renderFlight();
    scenes.flight?.addEventListener("pointerdown", onTap);
    rafId = requestAnimationFrame(flightTick);
  }

  function runCutscenes() {
    showScene("title");

    later(T.meet, () => showScene("meet"));
    later(T.walk, () => scenes.meet?.classList.add("is-walking"));
    later(T.bang, () => scenes.meet?.classList.add("is-bang"));
    later(T.heart, () => {
      scenes.meet?.classList.remove("is-bang");
      scenes.meet?.classList.add("is-heart");
    });
    later(T.years, () => showScene("years"));
    later(T.dusk, () => scenes.years?.classList.add("is-dusk"));
    later(T.night, () => {
      scenes.years?.classList.remove("is-dusk");
      scenes.years?.classList.add("is-night");
    });
    later(T.flight, startFlight);
  }

  function onSkip(event) {
    event.preventDefault();
    event.stopPropagation();
    scenes.flight?.removeEventListener("pointerdown", onTap);
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
