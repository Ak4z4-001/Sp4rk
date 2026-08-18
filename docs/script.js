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

function openEnvelope() {
  if (opened) return;
  opened = true;
  envelope.classList.add('open');

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
