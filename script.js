const envelope = document.getElementById('envelope');
const envelopeScene = document.getElementById('envelopeScene');
const letterScene = document.getElementById('letterScene');
const letterBody = document.getElementById('letterBody');
const signature = document.querySelector('.signature');
const backBtn = document.getElementById('backBtn');
const floatingHearts = document.getElementById('floatingHearts');

const MESSAGE = `Desde que dejaste de hablarme me sentí muy solo, la verdad. Me gustas demasiado, y sé que te dije que iba a dejar de molestar, pero creo que no puedo, porque cada vez que te veo, más me enamoro de ti.

Como te dije, no me gustan las relaciones a distancia, pero... ¿qué tal si lo intentamos? Tal vez funcione, no sé. Perdón si soy insistente, pero la verdad es que me gustas mucho, y sé que yo a ti no, pero tal vez poco a poco te pueda ganar, ¿no crees?

Tal vez suene un poco cursi, pero así soy cuando me enamoro de alguien de verdad. Y de ti me enamoré mucho más de lo que había pensado.`;

let typing = false;
let opened = false;
let heartsInterval = null;

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

envelope.addEventListener('click', openEnvelope);
envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openEnvelope();
  }
});
backBtn.addEventListener('click', closeToEnvelope);
