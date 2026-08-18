const envelope = document.getElementById('envelope');
const envelopeScene = document.getElementById('envelopeScene');
const letterScene = document.getElementById('letterScene');
const letterPaper = document.getElementById('letterPaper');
const letterBody = document.getElementById('letterBody');
const signature = document.getElementById('signature');
const flipBtn = document.getElementById('flipBtn');
const flipBackBtn = document.getElementById('flipBackBtn');
const backBtn = document.getElementById('backBtn');
const floatingHearts = document.getElementById('floatingHearts');

const choiceButtons = document.querySelectorAll('.choice-btn');
const explainWrap = document.getElementById('explainWrap');
const explainText = document.getElementById('explainText');
const sendBtn = document.getElementById('sendBtn');
const sendStatus = document.getElementById('sendStatus');
const doveLayer = document.getElementById('doveLayer');

const player = document.getElementById('player');
const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
const playerStatus = document.getElementById('playerStatus');

// To use your own audio file instead of YouTube, drop it next to this
// script and set LOCAL_AUDIO to its name, e.g. 'music.mp3'.
const LOCAL_AUDIO = null;
const YT_VIDEO_ID = 'znHE3ugGhnk';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1469940422095798477/lc9ZYzBJGm82CWMJYkwWwJvz4UwxynwzxnawGqK3MmtSlq2oKA9BubP7ahokkQ_Qh5KO';

const MESSAGE = `Desde que te dejé de hablar me sentí muy solo, la verdad. Y yo sé, que no hemos hablado mucho, pero la verdad me sentía bien hablando contigo, aunque me respondieras tres días después jajaja. Me gustas demasiado, y sé que te dije que iba a dejar de molestar, pero creo que no puedo, porque cada vez que te veo, más me enamoro de ti.

Como te dije, no me gustan las relaciones a distancia, pero... ¿qué tal si lo intentamos? Tal vez funcione, no sé. Perdón si soy insistente, pero la verdad es que me gustas mucho, y sé que yo a ti no, pero tal vez poco a poco te pueda ganar, ¿no crees?

Tal vez suene un poco cursi, pero así soy cuando me enamoro de alguien de verdad. Y de ti me enamoré mucho más de lo que había pensado.`;

let typing = false;
let opened = false;
let heartsInterval = null;
let selectedChoice = null;
let sending = false;
let faceSwapTimer = null;

/* ============ MUSIC ============ */

// One interface over either backend, so the UI code below doesn't care
// which one is in use.
const music = {
  backend: null,   // 'audio' | 'yt'
  el: null,
  ready: false,
  playing: false,
  userPaused: false,   // she hit pause on purpose: never restart behind her
  gestureArmed: false
};

function initMusic() {
  if (LOCAL_AUDIO) {
    const audio = new Audio(LOCAL_AUDIO);
    audio.loop = true;
    audio.volume = volumeSlider.value / 100;
    audio.addEventListener('canplay', () => { markMusicReady(); tryAutoplay(); });
    audio.addEventListener('play', () => setPlayingUI(true));
    audio.addEventListener('pause', () => setPlayingUI(false));
    audio.addEventListener('error', () => musicFailed('No se pudo cargar el audio'));
    music.backend = 'audio';
    music.el = audio;
  }
  // otherwise the YouTube API callback below takes over
}

function createYouTubePlayer() {
  if (LOCAL_AUDIO || music.backend === 'yt') return;
  music.backend = 'yt';
  music.el = new YT.Player('ytPlayer', {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      playsinline: 1,   // iOS: keep it inline instead of going fullscreen
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        music.el.setVolume(Number(volumeSlider.value));
        markMusicReady();
        tryAutoplay();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) setPlayingUI(true);
        else if (e.data === YT.PlayerState.PAUSED) setPlayingUI(false);
        else if (e.data === YT.PlayerState.ENDED) music.el.playVideo(); // loop
      },
      onError: () => musicFailed('Esta canción no se puede reproducir aquí')
    }
  });
}

// The API calls this hook when it finishes loading -- but if it already
// finished before this file ran, that call is gone for good and the song
// would silently never start. So claim it either way.
window.onYouTubeIframeAPIReady = createYouTubePlayer;
if (window.YT && window.YT.Player) createYouTubePlayer();

function markMusicReady() {
  if (music.ready) return;
  music.ready = true;
  playBtn.disabled = false;
  playerStatus.textContent = 'Toca ▶ para escucharla';
}

// The song should already be playing when she arrives. Browsers block
// audio that starts without a gesture, so: try immediately, and if the
// browser refuses, start on the very first thing she touches.
function tryAutoplay() {
  playMusic();
  setTimeout(() => {
    if (!music.playing && !music.userPaused) armGestureStart();
  }, 900);
}

function armGestureStart() {
  if (music.gestureArmed) return;
  music.gestureArmed = true;
  playerStatus.textContent = 'Toca la pantalla para la música 🎶';

  const start = () => {
    document.removeEventListener('pointerdown', start, true);
    document.removeEventListener('keydown', start, true);
    music.gestureArmed = false;
    if (!music.userPaused) playMusic();
  };
  // capture phase: fires even if something else stops the event
  document.addEventListener('pointerdown', start, true);
  document.addEventListener('keydown', start, true);
}

function musicFailed(msg) {
  music.ready = false;
  playBtn.disabled = true;
  playerStatus.textContent = msg;
}

function setPlayingUI(isPlaying) {
  music.playing = isPlaying;
  player.classList.toggle('playing', isPlaying);
  playBtn.textContent = isPlaying ? '❚❚' : '▶';
  playerStatus.textContent = isPlaying ? 'Sonando 🎶' : 'En pausa';
}

function playMusic() {
  if (!music.ready) return;
  if (music.backend === 'yt') {
    music.el.playVideo();
  } else {
    // A rejected promise here means the browser blocked it.
    music.el.play().catch(() => {
      if (!music.userPaused) armGestureStart();
    });
  }
}

function pauseMusic() {
  if (!music.ready) return;
  if (music.backend === 'yt') music.el.pauseVideo();
  else music.el.pause();
}

function toggleMusic() {
  if (music.playing) {
    music.userPaused = true;   // her choice wins from here on
    pauseMusic();
  } else {
    music.userPaused = false;
    playMusic();
  }
}

function setVolume(value) {
  if (!music.el) return;
  if (music.backend === 'yt') {
    if (music.ready) music.el.setVolume(Number(value));
  } else {
    music.el.volume = value / 100;
  }
}

function openEnvelope() {
  if (opened) return;
  opened = true;
  envelope.classList.add('open');

  // Belt and braces: if autoplay was blocked and the envelope is the
  // first thing she touches, this tap is a valid gesture to start on.
  if (!music.userPaused) playMusic();

  setTimeout(() => {
    letterScene.classList.add('visible');
    startTyping();
    startFloatingHearts();
  }, 650);
}

function closeToEnvelope() {
  letterScene.classList.remove('visible');
  stopFloatingHearts();
  clearTimeout(typing);
  letterBody.textContent = '';
  signature.classList.remove('show');
  flipBtn.classList.remove('show');
  clearTimeout(faceSwapTimer);
  letterPaper.classList.remove('flipped', 'show-back');
  setTimeout(() => {
    envelope.classList.remove('open');
    opened = false;
  }, 300);
}

function startTyping() {
  letterBody.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  letterBody.appendChild(cursor);

  let i = 0;
  const speed = 28;

  function step() {
    if (i < MESSAGE.length) {
      cursor.insertAdjacentText('beforebegin', MESSAGE[i]);
      i++;
      const ch = MESSAGE[i - 1];
      const pause = (ch === '.' || ch === ',' || ch === '\n') ? speed * 6 : speed;
      typing = setTimeout(step, pause);
    } else {
      cursor.remove();
      signature.classList.add('show');
      flipBtn.classList.add('show');
    }
  }
  step();
}

function startFloatingHearts() {
  const hearts = ['💕', '💖', '💗', '💝', '⭐'];
  heartsInterval = setInterval(() => {
    const span = document.createElement('span');
    span.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    span.style.left = Math.random() * 90 + '%';
    const duration = 4 + Math.random() * 3;
    span.style.animationDuration = duration + 's';
    span.style.fontSize = (0.9 + Math.random() * 0.9) + 'rem';
    floatingHearts.appendChild(span);
    setTimeout(() => span.remove(), duration * 1000);
  }, 700);
}

function stopFloatingHearts() {
  clearInterval(heartsInterval);
  floatingHearts.innerHTML = '';
}

// Swap which face is interactive/visible at the midpoint of the rotation,
// while the card is edge-on and the change can't be seen.
const FLIP_MIDPOINT_MS = 275;

function showFace(back) {
  clearTimeout(faceSwapTimer);
  letterPaper.classList.toggle('flipped', back);
  faceSwapTimer = setTimeout(() => {
    letterPaper.classList.toggle('show-back', back);
  }, FLIP_MIDPOINT_MS);
}

function flipToBack() {
  showFace(true);
}

function flipToFront() {
  showFace(false);
}

async function sendResponse() {
  if (sending) return;
  if (!selectedChoice) {
    sendStatus.textContent = 'Elige una opción primero 🙈';
    return;
  }
  sending = true;
  sendBtn.disabled = true;
  sendBtn.textContent = 'Enviando...';
  sendStatus.textContent = '';

  doveLayer.classList.remove('flying');
  void doveLayer.offsetWidth;
  doveLayer.classList.add('flying');
  letterPaper.classList.add('sending');

  const payload = {
    content: `💌 **Respuesta de Estrellita**\n\n**Elección:** ${selectedChoice}\n**Mensaje:** ${explainText.value.trim() || '(sin mensaje adicional)'}`
  };

  const animationDone = new Promise((resolve) => setTimeout(resolve, 3000));
  const request = fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then((r) => r.ok).catch(() => false);

  const [, ok] = await Promise.all([animationDone, request]);

  doveLayer.classList.remove('flying');
  letterPaper.classList.remove('sending');
  sending = false;

  if (ok) {
    sendStatus.textContent = '¡Enviado! 🕊️💌 Ya va en camino.';
    sendBtn.textContent = 'Enviado ✔️';
    explainText.disabled = true;
    choiceButtons.forEach((b) => (b.disabled = true));
  } else {
    sendStatus.textContent = 'Ups, no se pudo enviar. Intenta de nuevo 🙏';
    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar 💌';
  }
}

playBtn.disabled = true;
initMusic();

playBtn.addEventListener('click', toggleMusic);
volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));

// Keep taps on the player from reaching the envelope behind it.
player.addEventListener('click', (e) => e.stopPropagation());

envelope.addEventListener('click', openEnvelope);
envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openEnvelope();
  }
});
backBtn.addEventListener('click', closeToEnvelope);
flipBtn.addEventListener('click', flipToBack);
flipBackBtn.addEventListener('click', flipToFront);

choiceButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    choiceButtons.forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedChoice = btn.dataset.choice;
    explainWrap.classList.add('show');
    sendStatus.textContent = '';
  });
});

sendBtn.addEventListener('click', sendResponse);
