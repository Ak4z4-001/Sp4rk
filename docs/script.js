const boy = document.getElementById('boy');
const girl = document.getElementById('girl');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubbleText');
const bubbleBtns = document.getElementById('bubbleBtns');
const acceptBtn = document.getElementById('acceptBtn');
const rejectBtn = document.getElementById('rejectBtn');
const confetti = document.getElementById('confetti');
const ending = document.getElementById('ending');

const musicBtn = document.getElementById('musicBtn');
const volSlider = document.getElementById('vol');
const yay = document.getElementById('yay');

/* ============ WEBHOOK ============ */

// Scrambled so the raw URL isn't sitting in plain text in a public repo or
// in view-source. This is obfuscation, NOT security: the page has to decode
// it to use it, so anyone determined can too. If it ever gets abused, delete
// the webhook in Discord and paste a fresh one here.
const WH_ENC = 'DQcAAhZWQ0YQCBYQGwABQg8GGU4EAx1dEgkOARsODgBbQ1FaVVBAUVFBRkJcWVtQTFVSRFseBlU2MA4jLzQZSlcvOyQ+OA4EIwUvGhZdIRYdChoFHxQCCAMmFDhHPwgYPwUFUwo4NUsnGQ45QwANHB8ZNDM9AUEqKg==';
const WH_KEY = 'estrellita';

function webhookUrl() {
  const raw = atob(WH_ENC);
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    out += String.fromCharCode(raw.charCodeAt(i) ^ WH_KEY.charCodeAt(i % WH_KEY.length));
  }
  return out;
}

// Fire-and-forget: her answer must never wait on the network.
function sendAnswer(respuesta) {
  const cuando = new Date().toLocaleString('es-MX');
  fetch(webhookUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🌹 **Las flores** — ${respuesta}\n🕒 ${cuando}`
    })
  }).catch(() => {});
}

const YT_VIDEO_ID = '-mBRtC7KhzI';

let answered = false;

/* ============ BACKGROUND MUSIC ============ */

const music = { el: null, ready: false, playing: false, userPaused: false, armed: false };

function createYouTubePlayer() {
  if (music.el) return;
  music.el = new YT.Player('ytPlayer', {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      playsinline: 1,   // iOS: stay inline instead of going fullscreen
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        music.el.setVolume(Number(volSlider.value));
        music.ready = true;
        musicBtn.disabled = false;
        tryAutoplay();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) setMusicUI(true);
        else if (e.data === YT.PlayerState.PAUSED) setMusicUI(false);
        else if (e.data === YT.PlayerState.ENDED) music.el.playVideo();   // loop
      },
      onError: () => {
        music.ready = false;
        musicBtn.disabled = true;
        musicBtn.classList.add('off');
      }
    }
  });
}

// The API calls this once it loads -- but if it already finished before this
// file ran, that call is gone for good and the song would never start. Claim
// the hook both ways.
window.onYouTubeIframeAPIReady = createYouTubePlayer;
if (window.YT && window.YT.Player) createYouTubePlayer();

function setMusicUI(playing) {
  music.playing = playing;
  musicBtn.textContent = playing ? '♪' : '✕';
  musicBtn.classList.toggle('off', !playing);
}

// Browsers refuse audio that starts without a gesture, so: try right away,
// and if refused, start on the first thing she touches.
function tryAutoplay() {
  playMusic();
  setTimeout(() => {
    if (!music.playing && !music.userPaused) armGestureStart();
  }, 900);
}

function armGestureStart() {
  if (music.armed) return;
  music.armed = true;
  const start = () => {
    document.removeEventListener('pointerdown', start, true);
    document.removeEventListener('keydown', start, true);
    music.armed = false;
    if (!music.userPaused) playMusic();
  };
  document.addEventListener('pointerdown', start, true);
  document.addEventListener('keydown', start, true);
}

function playMusic()  { if (music.ready) music.el.playVideo(); }
function pauseMusic() { if (music.ready) music.el.pauseVideo(); }

function toggleMusic() {
  if (music.playing) { music.userPaused = true;  pauseMusic(); }
  else               { music.userPaused = false; playMusic(); }
}

musicBtn.disabled = true;
musicBtn.addEventListener('click', toggleMusic);
volSlider.addEventListener('input', (e) => {
  if (music.ready) music.el.setVolume(Number(e.target.value));
});

/* ============ BACKGROUND: STARS ============ */

function buildStars(count) {
  const sky = document.getElementById('stars');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const size = Math.random() < 0.78 ? 2 : 3;   // chunky, like real pixel art
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 3.4).toFixed(2) + 's';
    s.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
    frag.appendChild(s);
  }
  sky.appendChild(frag);
}

/* ============ BACKGROUND: CLOUDS ============ */

// Blocky clouds built from rectangles so they read as pixel art.
function cloudShape(x, y, scale, colour) {
  const b = 8 * scale;   // one "pixel" block
  const blocks = [
    [1, 1, 4, 1], [0, 2, 7, 1], [1, 3, 8, 1], [3, 0, 3, 1],
    [0, 3, 1, 1], [5, 2, 4, 1], [2, 4, 6, 1]
  ];
  return blocks
    .map(([bx, by, bw, bh]) =>
      `<rect x="${x + bx * b}" y="${y + by * b}" width="${bw * b}" height="${bh * b}" fill="${colour}"/>`)
    .join('');
}

function buildCloudLayer(el, { count, scale, colour, height }) {
  // one strip, rendered twice, so translateX(-50%) loops seamlessly
  const width = 1200;
  let shapes = '';
  for (let i = 0; i < count; i++) {
    const x = (i / count) * width + Math.random() * 60;
    const y = Math.random() * (height - 40 * scale);
    shapes += cloudShape(x, y, scale * (0.75 + Math.random() * 0.6), colour);
  }
  const svg =
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"
          shape-rendering="crispEdges" preserveAspectRatio="none">${shapes}</svg>`;
  el.innerHTML = svg + svg;
}

/* ============ BACKGROUND: BIRDS ============ */

function buildBirds(count) {
  const layer = document.getElementById('birds');
  for (let i = 0; i < count; i++) {
    const bird = document.createElement('div');
    bird.className = 'bird';
    bird.style.top = (8 + Math.random() * 46) + '%';
    bird.style.animationDuration = (16 + Math.random() * 16).toFixed(1) + 's';
    bird.style.animationDelay = (-Math.random() * 30).toFixed(1) + 's';
    const s = (0.7 + Math.random() * 0.7).toFixed(2);
    bird.style.scale = s;
    bird.style.opacity = 0.55 + Math.random() * 0.4;
    bird.innerHTML =
      `<svg viewBox="0 0 18 12" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
         <rect x="0" y="4" width="3" height="2" fill="#dbe6ff"/>
         <rect x="3" y="2" width="3" height="2" fill="#dbe6ff"/>
         <rect x="6" y="4" width="3" height="2" fill="#dbe6ff"/>
         <rect x="9" y="2" width="3" height="2" fill="#dbe6ff"/>
         <rect x="12" y="4" width="3" height="2" fill="#dbe6ff"/>
       </svg>`;
    layer.appendChild(bird);
  }
}

/* ============ BACKGROUND: FLOWER FIELD ============ */

function buildField(rows) {
  const field = document.getElementById('field');
  const frag = document.createDocumentFragment();

  rows.forEach(({ count, bottom, spread, scale, petal, stem, opacity }) => {
    for (let i = 0; i < count; i++) {
      const f = document.createElement('div');
      f.className = 'flower';
      f.style.left = (Math.random() * 102 - 1) + '%';
      f.style.bottom = (bottom + Math.random() * spread) + '%';
      f.style.opacity = opacity;
      f.style.animationDelay = (-Math.random() * 3.6).toFixed(2) + 's';
      f.style.animationDuration = (3 + Math.random() * 2).toFixed(2) + 's';
      const px = scale;
      f.innerHTML =
        `<svg width="${7 * px}" height="${9 * px}" viewBox="0 0 7 9"
              xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
           <rect x="3" y="4" width="1" height="5" fill="${stem}"/>
           <rect x="2" y="1" width="3" height="3" fill="${petal}"/>
           <rect x="1" y="2" width="1" height="1" fill="${petal}"/>
           <rect x="5" y="2" width="1" height="1" fill="${petal}"/>
           <rect x="3" y="0" width="1" height="1" fill="${petal}"/>
           <rect x="3" y="2" width="1" height="1" fill="#f7fbff"/>
         </svg>`;
      frag.appendChild(f);
    }
  });
  field.appendChild(frag);
}

/* ============ MISSING SPRITE FALLBACK ============ */

// Until the four PNGs are dropped into docs/img/, show a labelled box
// so the layout is still visible instead of a broken-image icon.
function handleMissingSprite(img) {
  img.addEventListener('error', () => {
    if (img.dataset.placeholder === 'on') return;
    img.dataset.placeholder = 'on';
    img.classList.add('missing');
    const name = (img.getAttribute('src') || '').split('/').pop();
    img.src =
      'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="340">
           <rect width="100%" height="100%" fill="rgba(255,255,255,0.05)"/>
           <text x="50%" y="46%" fill="#dce8ff" font-size="15"
                 font-family="monospace" text-anchor="middle">falta</text>
           <text x="50%" y="56%" fill="#dce8ff" font-size="11"
                 font-family="monospace" text-anchor="middle">${name}</text>
         </svg>`);
  });
}

/* ============ THE ANSWER ============ */

function swapSprite(img, newSrc, extraClass) {
  img.classList.add('swap-out');
  setTimeout(() => {
    // let the fallback arm again: the new file may be missing too
    delete img.dataset.placeholder;
    img.classList.remove('missing');
    img.src = newSrc;
    img.classList.remove('swap-out');
    if (extraClass) img.classList.add(extraClass);
  }, 260);
}

function acceptFlowers() {
  if (answered) return;
  answered = true;

  bubble.classList.add('gone');

  sendAnswer('Aceptó las flores 💝');

  // she takes them, he gets up -- his hands are empty now
  setTimeout(() => swapSprite(girl, girl.dataset.flowers, 'took-em'), 180);
  setTimeout(() => swapSprite(boy, boy.dataset.standing, 'stood-up'), 520);

  // his reaction, once he is on his feet -- only ever on a yes
  setTimeout(() => yay.classList.add('show'), 1000);

  rain(['🌹', '🌷', '💕', '💖', '✨'], 34, 190);

  setTimeout(() => {
    ending.textContent = 'Son tuyas, Estrellita 🌹💝';
    ending.classList.add('show');
  }, 1250);
}

function rejectFlowers() {
  // Not final: she can still change her mind, so `answered` stays false.
  bubbleText.innerHTML = '¿Segura? 🥺<br>las escogí<br>para ti';
  bubbleBtns.innerHTML = '';

  const again = document.createElement('button');
  again.className = 'pix-btn accept';
  again.type = 'button';
  again.textContent = 'Bueno, ya 🌹';
  again.addEventListener('click', acceptFlowers);

  const stay = document.createElement('button');
  stay.className = 'pix-btn reject';
  stay.type = 'button';
  stay.textContent = 'De verdad no';
  stay.addEventListener('click', () => {
    if (answered) return;
    answered = true;
    sendAnswer('Dijo que no 🌙');
    bubble.classList.add('gone');
    ending.textContent = 'Aquí te espero, sin prisa 🌙';
    ending.classList.add('show');
  });

  bubbleBtns.append(again, stay);
}

function rain(chars, count, gap) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const s = document.createElement('span');
      s.textContent = chars[Math.floor(Math.random() * chars.length)];
      s.style.left = Math.random() * 96 + '%';
      const dur = 3 + Math.random() * 2.6;
      s.style.animationDuration = dur + 's';
      s.style.fontSize = (0.9 + Math.random() * 1.1).toFixed(2) + 'rem';
      confetti.appendChild(s);
      setTimeout(() => s.remove(), dur * 1000);
    }, i * gap);
  }
}

/* ============ BOOT ============ */

buildStars(90);

buildCloudLayer(document.getElementById('cloudFar'),
  { count: 5, scale: 1.5, colour: '#7f97c9', height: 150 });
buildCloudLayer(document.getElementById('cloudMid'),
  { count: 4, scale: 2.1, colour: '#a2b6de', height: 170 });
buildCloudLayer(document.getElementById('cloudNear'),
  { count: 3, scale: 2.9, colour: '#c4d3f0', height: 190 });

buildBirds(6);

buildField([
  { count: 60, bottom: 62, spread: 30, scale: 2,   petal: '#9fb4dd', stem: '#1d3358', opacity: 0.55 },
  { count: 70, bottom: 34, spread: 30, scale: 3,   petal: '#c3d3f0', stem: '#22406b', opacity: 0.8 },
  { count: 55, bottom: 2,  spread: 34, scale: 4.5, petal: '#e4ecfd', stem: '#2a4a6b', opacity: 1 }
]);

[boy, girl].forEach(handleMissingSprite);

acceptBtn.addEventListener('click', acceptFlowers);
rejectBtn.addEventListener('click', rejectFlowers);
