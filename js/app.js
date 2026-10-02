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
  let slideIndex = 0;

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

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("계좌번호가 복사되었습니다");
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
    const c = data.ceremony;
    const g = data.parents.groomSide;
    const b = data.parents.brideSide;
    const [year, month, day] = c.dateISO.split("-").map(Number);
    $("#date-line").textContent = `${year}년 ${month}월 ${day}일 ${c.weekdayLabel}`;
    $("#time-line").textContent = c.timeLabel;
    $("#venue-line").innerHTML = `${c.venueName}<br />${c.venueHall}`;
    $("#parents-lines").innerHTML = `
      <p>${g.father.name} 부 · ${g.mother.name} 모의 아들 ${g.childName}</p>
      <p>${b.father.name} 부 · ${b.mother.name} 모의 딸 ${b.childName}</p>
    `;
  }

  function renderGallery() {
    const grid = $("#gallery-grid");
    const tilts = [-2.4, 1.8, -1.2, 2.6, -2, 1.4];
    grid.innerHTML = photos
      .map(
        (item, index) => `
        <button type="button" class="stamp" data-index="${index}" style="transform:rotate(${tilts[index % tilts.length]}deg)" aria-label="${item.alt}">
          <img src="${item.src}" alt="${item.alt}" loading="lazy" />
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
    const box = $("#lightbox-thumbs");
    box.innerHTML = photos
      .map(
        (item, index) => `
        <button type="button" data-thumb="${index}" aria-label="${item.alt}">
          <img src="${item.src}" alt="" />
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
    image.src = item.src;
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
    const image = $("#lightbox-image");
    image.addEventListener("touchstart", (event) => {
      startX = event.changedTouches[0].clientX;
    }, { passive: true });
    image.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      showViewer(viewerIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

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
  }

  function renderAccounts() {
    const sides = [
      ["신랑측 계좌번호", data.accounts.groomSide],
      ["신부측 계좌번호", data.accounts.brideSide],
    ];
    $("#accounts-block").innerHTML = sides
      .map(([label, side], index) => {
        const rows = side.items
          .map(
            (item) => `
            <div class="account">
              <div>
                <p class="account__role">${item.role}</p>
                <p class="account__bank">${item.bank} · ${item.holder}</p>
                <p class="account__number">${item.number}</p>
              </div>
              <button type="button" class="account__copy" data-copy="${item.number}">복사</button>
            </div>`
          )
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

  function renderCarousel() {
    const track = $("#carousel-track");
    const dots = $("#carousel-dots");
    const count = track.children.length;
    dots.innerHTML = Array.from({ length: count }, (_, i) => {
      return `<button type="button" data-dot="${i}" aria-label="${i + 1}번 안내"></button>`;
    }).join("");

    function go(index) {
      slideIndex = (index + count) % count;
      track.style.transform = `translateX(-${slideIndex * 100}%)`;
      dots.querySelectorAll("button").forEach((btn, i) => {
        btn.classList.toggle("is-on", i === slideIndex);
      });
    }

    $("#carousel-prev").addEventListener("click", () => go(slideIndex - 1));
    $("#carousel-next").addEventListener("click", () => go(slideIndex + 1));
    dots.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-dot]");
      if (!btn) return;
      go(Number(btn.dataset.dot));
    });

    let startX = 0;
    const viewport = $("#carousel-viewport");
    viewport.addEventListener("touchstart", (event) => {
      startX = event.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      go(slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    go(0);
  }

  function contactRow(label, name, phone) {
    if (!phone) return "";
    const tel = phone.replace(/[^\d+]/g, "");
    return `
      <div class="contact-person">
        <p class="contact-person__name">${label} ${name}</p>
        <a class="contact-person__action" href="tel:${tel}">전화</a>
        <a class="contact-person__action" href="sms:${tel}">문자</a>
      </div>`;
  }

  function openContact(side) {
    const isGroom = side === "groom";
    const modal = $("#contact-modal");
    const parent = isGroom ? data.parents.groomSide : data.parents.brideSide;
    const person = isGroom ? data.couple.groom : data.couple.bride;
    $("#contact-modal-title").textContent = isGroom ? "신랑측 연락하기" : "신부측 연락하기";
    $("#contact-modal-body").innerHTML = [
      contactRow(isGroom ? "신랑" : "신부", person.ko, person.phone),
      contactRow("아버지", parent.father.name, parent.father.phone),
      contactRow("어머니", parent.mother.name, parent.mother.phone),
    ].join("");
    modal.hidden = false;
    document.body.classList.add("is-locked");
  }

  function closeContact() {
    $("#contact-modal").hidden = true;
    document.body.classList.remove("is-locked");
  }

  function bindContacts() {
    document.querySelectorAll("[data-contact-side]").forEach((button) => {
      button.addEventListener("click", () => openContact(button.dataset.contactSide));
    });
    document.querySelectorAll("[data-contact-close]").forEach((button) => {
      button.addEventListener("click", closeContact);
    });
  }

  function init() {
    document.title = data.meta.documentTitle;
    renderCover();
    renderWedding();
    renderGallery();
    renderThumbs();
    bindViewer();
    renderCalendar();
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
    renderLocation();
    renderAccounts();
    renderCarousel();
    bindContacts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
