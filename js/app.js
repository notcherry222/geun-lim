/**
 * 렌더 / 인터랙션
 * 문구·계좌·사진·장소는 data.js만 수정하면 됩니다.
 */
(function () {
  const data = window.WEDDING_DATA;
  if (!data) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const photos = data.images.gallery || [];
  let viewerIndex = 0;
  let thumbsRendered = false;
  const assetVersion = "20261003opt";

  const withoutQuery = (src) => src.split("?")[0];
  const versionedSrc = (src) => `${withoutQuery(src)}?v=${assetVersion}`;
  const thumbnailSrc = (src) => {
    const cleanSrc = withoutQuery(src);
    return `${cleanSrc.replace("/gallery/", "/gallery/thumbs/")}?v=${assetVersion}`;
  };

  function showToast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      el.hidden = true;
    }, 1600);
  }

  async function copyText(text, successMessage = "계좌번호가 복사되었습니다") {
    try {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      }
      if (!copied) throw new Error("Copy failed");
      showToast(successMessage);
    } catch (err) {
      showToast("복사에 실패했습니다");
    }
  }

  function ceremonyTarget() {
    const iso = data.ceremony.dateISO || "2027-01-09";
    return new Date(`${iso}T13:30:00+09:00`);
  }

  function renderCover() {
    const img = $("#cover-image");
    const fallback = $("#cover-fallback");
    img.addEventListener("load", () => {
      img.hidden = false;
      fallback.hidden = true;
    });
    img.addEventListener("error", () => {
      img.hidden = true;
      fallback.hidden = false;
    });
  }

  function renderWedding() {
    const g = data.parents.groomSide;
    const b = data.parents.brideSide;
    $("#parents-lines").innerHTML = `
      <p>${g.father.name} 부 · ${g.mother.name} 모의 아들 ${g.childName}</p>
      <p>${b.father.name} 부 · ${b.mother.name} 모의 딸 ${b.childName}</p>
    `;
  }

  function revealWriting() {
    const script = $(".script");
    const writing = $(".script__writing-image");
    if (!script) return;

    async function reveal() {
      if (writing?.decode) {
        try {
          await writing.decode();
        } catch {
          // PNG fallback can still be displayed if decoding the preferred source fails.
        }
      }
      script.classList.add("is-visible");
    }

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      { threshold: 0.45 }
    );
    observer.observe(script);
  }

  function renderGallery() {
    const grid = $("#gallery-grid");
    const tilts = [-2.4, 1.8, -1.2, 2.6, -2, 1.4];
    grid.innerHTML = photos
      .map(
        (item, index) => `
        <button type="button" class="stamp" data-index="${index}" style="transform:rotate(${tilts[index % tilts.length]}deg)" aria-label="${item.alt}">
          <img src="${thumbnailSrc(item.src)}" alt="${item.alt}" loading="lazy" decoding="async" />
        </button>`
      )
      .join("");

    grid.querySelectorAll(".stamp img").forEach((img) => {
      const mark = () => {
        if (img.naturalWidth > img.naturalHeight * 1.05) {
          img.closest(".stamp")?.classList.add("is-land");
        }
      };
      if (img.complete) mark();
      else img.addEventListener("load", mark);
    });

    grid.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-index]");
      if (!btn) return;
      openViewer(Number(btn.dataset.index));
    });
  }

  function renderThumbs() {
    if (thumbsRendered) return;
    thumbsRendered = true;
    const box = $("#lightbox-thumbs");
    box.innerHTML = photos
      .map(
        (item, index) => `
        <button type="button" data-thumb="${index}" aria-label="${item.alt}">
          <img src="${thumbnailSrc(item.src)}" alt="" loading="lazy" decoding="async" />
        </button>`
      )
      .join("");
    box.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-thumb]");
      if (!btn) return;
      showViewer(Number(btn.dataset.thumb));
    });
  }

  function showViewer(index) {
    viewerIndex = (index + photos.length) % photos.length;
    const item = photos[viewerIndex];
    const image = $("#lightbox-image");
    image.style.transform = "";
    image.style.transformOrigin = "";
    image.style.transition = "";
    image.src = versionedSrc(item.src);
    image.alt = item.alt;
    $("#lightbox-thumbs").querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-on", i === viewerIndex);
      if (i === viewerIndex) btn.scrollIntoView({ inline: "center", block: "nearest" });
    });
  }

  function openViewer(index) {
    const box = $("#lightbox");
    box.hidden = false;
    document.body.classList.add("is-locked");
    renderThumbs();
    showViewer(index);
  }

  function closeViewer() {
    $("#lightbox").hidden = true;
    document.body.classList.remove("is-locked");
  }

  function bindViewer() {
    $("#lightbox-close").addEventListener("click", closeViewer);
    $("#lightbox-prev").addEventListener("click", () => showViewer(viewerIndex - 1));
    $("#lightbox-next").addEventListener("click", () => showViewer(viewerIndex + 1));
    $("#lightbox").addEventListener("click", (event) => {
      if (event.target.id === "lightbox") closeViewer();
    });

    let startX = 0;
    let pinchStartDistance = 0;
    let pinchActive = false;
    let pinchGesture = false;
    const image = $("#lightbox-image");

    const touchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const resetZoom = () => {
      image.classList.remove("is-mouse-zooming");
      image.style.transition = "transform 180ms ease";
      image.style.transform = "scale(1)";
      image.addEventListener(
        "transitionend",
        () => {
          image.style.transition = "";
          image.style.transformOrigin = "";
        },
        { once: true }
      );
    };

    image.addEventListener("touchstart", (event) => {
      if (event.touches.length === 2) {
        const rect = image.getBoundingClientRect();
        const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
        const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
        pinchStartDistance = touchDistance(event.touches);
        pinchActive = true;
        pinchGesture = true;
        image.style.transition = "none";
        image.style.transformOrigin = `${centerX}px ${centerY}px`;
        event.preventDefault();
        return;
      }
      if (!pinchGesture) startX = event.touches[0].clientX;
    }, { passive: false });

    image.addEventListener("touchmove", (event) => {
      if (!pinchActive || event.touches.length !== 2) return;
      event.preventDefault();
      const scale = Math.min(3, Math.max(1, touchDistance(event.touches) / pinchStartDistance));
      image.style.transform = `scale(${scale})`;
    }, { passive: false });

    image.addEventListener("touchend", (event) => {
      if (pinchGesture) {
        if (pinchActive && event.touches.length < 2) {
          pinchActive = false;
          resetZoom();
        }
        if (event.touches.length === 0) pinchGesture = false;
        return;
      }
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      showViewer(viewerIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    image.addEventListener("touchcancel", () => {
      if (pinchActive) resetZoom();
      pinchActive = false;
      pinchGesture = false;
    }, { passive: true });

    let mouseZoomActive = false;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const setMouseOrigin = (event) => {
      const rect = image.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      image.style.transformOrigin = `${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`;
    };

    image.addEventListener("mousedown", (event) => {
      if (!finePointer.matches || event.button !== 0) return;
      mouseZoomActive = true;
      setMouseOrigin(event);
      image.classList.add("is-mouse-zooming");
      image.style.transition = "transform 140ms ease";
      image.style.transform = "scale(2)";
      event.preventDefault();
    });

    image.addEventListener("mousemove", (event) => {
      if (!mouseZoomActive) return;
      setMouseOrigin(event);
    });

    window.addEventListener("mouseup", () => {
      if (!mouseZoomActive) return;
      mouseZoomActive = false;
      resetZoom();
    });

    window.addEventListener("blur", () => {
      if (!mouseZoomActive) return;
      mouseZoomActive = false;
      resetZoom();
    });

    document.addEventListener("keydown", (event) => {
      if ($("#lightbox").hidden) return;
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showViewer(viewerIndex - 1);
      if (event.key === "ArrowRight") showViewer(viewerIndex + 1);
    });
  }

  function renderCalendar() {
    const [y, m, d] = data.ceremony.dateISO.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0).getDate();
    const lead = first.getDay();
    const names = ["일", "월", "화", "수", "목", "금", "토"];
    const head = names
      .map((name, i) => {
        const cls = i === 0 ? " is-sun" : i === 6 ? " is-sat" : "";
        return `<span class="calendar__dow${cls}">${name}</span>`;
      })
      .join("");
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push('<span class="calendar__day is-empty"></span>');
    for (let day = 1; day <= last; day += 1) {
      if (day === d) {
        cells.push(`<span class="calendar__day"><span class="heart-date">${day}</span></span>`);
      } else {
        cells.push(`<span class="calendar__day">${day}</span>`);
      }
    }
    $("#calendar").innerHTML = `
      <p class="calendar__title">${y}년 ${m}월</p>
      <div class="calendar__grid">${head}${cells.join("")}</div>
    `;
    $("#save-when").textContent = `${y}년 ${m}월 ${d}일(${data.ceremony.weekdayLabel.replace("요일", "")}) ${data.ceremony.timeLabel}`;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function renderCountdown() {
    const target = ceremonyTarget().getTime();
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    $("#cd-days").textContent = pad(days);
    $("#cd-hours").textContent = pad(hours);
    $("#cd-mins").textContent = pad(mins);
    $("#cd-secs").textContent = pad(secs);
    $("#save-left").innerHTML = `신랑♥︎신부 결혼식이 <strong>${days}</strong>일 남았습니다.`;
  }

  function renderLocation() {
    const c = data.ceremony;
    const q = encodeURIComponent(`${c.venueName} ${c.addressLines[0]}`);
    $("#map-frame").src = `https://maps.google.com/maps?q=${q}&z=16&hl=ko&output=embed`;
    const links = data.transport.mapLinks;
    $("#map-links").innerHTML = `
      <a href="${links.naver}" target="_blank" rel="noopener">네이버지도</a>
      <span>|</span>
      <a href="${links.kakao}" target="_blank" rel="noopener">카카오맵</a>
    `;
    $("#location-address").innerHTML = `${c.addressLines[0]}<br />${c.venueName} ${c.venueHall}`;
    const transport = data.transport;
    $("#transport-guide").innerHTML = `
      <section class="transport-guide__item">
        <h3>지하철 · 셔틀</h3>
        <p>${transport.subway.note}</p>
      </section>
      <section class="transport-guide__item">
        <h3>${transport.bus.title}</h3>
        <p>${transport.bus.lines.join("<br />")}</p>
        <p class="transport-guide__note">${transport.bus.note}</p>
      </section>
      <section class="transport-guide__item">
        <h3>${transport.car.title} · 주차</h3>
        <p>${transport.car.notes.join("<br />")}</p>
      </section>
    `;
  }

  function renderAccounts() {
    const sides = [
      ["신랑측", data.accounts.groomSide],
      ["신부측", data.accounts.brideSide],
    ];
    $("#accounts-block").innerHTML = sides
      .map(([label, side], index) => {
        const rows = side.items
          .map((item) => {
            const phoneLink = item.phone
              ? `<a class="account__phone" href="tel:${item.phone.replace(/[^\d+]/g, "")}">♥ ${item.phone}</a>`
              : "";
            return `
            <div class="account">
              <div>
                <p class="account__role">${item.role} · ${item.holder}</p>
                <p class="account__number">♥ ${item.number} ${item.bank}</p>
                ${phoneLink}
              </div>
              <button type="button" class="account__copy" data-copy="${item.number}">복사</button>
            </div>`;
          })
          .join("");
        return `
          <div class="acc">
            <button type="button" class="acc__toggle" aria-expanded="false" aria-controls="acc-panel-${index}">
              ${label}
            </button>
            <div class="acc__panel" id="acc-panel-${index}" hidden>${rows}</div>
          </div>`;
      })
      .join("");

    $("#accounts-block").addEventListener("click", (event) => {
      const toggle = event.target.closest(".acc__toggle");
      if (toggle) {
        const panel = toggle.nextElementSibling;
        const open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      const copy = event.target.closest("[data-copy]");
      if (copy) copyText(copy.dataset.copy);
    });
  }

  function bindUrlCopy() {
    $("#copy-url").addEventListener("click", () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}`;
      copyText(shareUrl, "청첩장 주소가 복사되었습니다");
    });
  }

  function init() {
    document.title = data.meta.documentTitle;
    renderCover();
    renderWedding();
    revealWriting();
    renderGallery();
    bindViewer();
    renderCalendar();
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
    renderLocation();
    renderAccounts();
    bindUrlCopy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
