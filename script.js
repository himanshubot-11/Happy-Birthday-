/* Professional interactive birthday page
   - Robust audio start using Web Audio API + user gesture
   - Canvas particles (hearts + subtle sparkles)
   - 3D book open + flipping pages with particle bursts
   - Confetti+final reveal when book closes
*/

/* ---------------------------
   CONFIG + ELEMENTS
--------------------------- */
const CONFIG = {
  musicFile: 'happy.mp3',       // drop your MP3 here
  flipFile: 'pageflip.mp3',     // optional small page flip sound
  pageFlipDelay: 700,          // ms between page flips (timing read)
  finalConfettiCount: 36
};

const playControl = document.getElementById('playControl');
const playIcon = document.getElementById('playIcon');
const bookWrap = document.getElementById('bookWrap');
const book = document.getElementById('book');
const pages = Array.from(document.querySelectorAll('.page'));
const coverLeft = document.getElementById('coverLeft');
const coverRight = document.getElementById('coverRight');
const finalScreen = document.getElementById('finalScreen');

const musicEl = document.getElementById('music');
const flipEl = document.getElementById('pageFlipAudio');

/* ---------- Audio: Web Audio API wrapper for reliability ---------- */
let audioCtx = null;
let musicSource = null;
let flipSource = null;
async function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // create media element source for music
    musicSource = audioCtx.createMediaElementSource(musicEl);
    const gain = audioCtx.createGain();
    gain.gain.value = 1.0;
    musicSource.connect(gain).connect(audioCtx.destination);
    // flip
    if (flipEl) {
      flipSource = audioCtx.createMediaElementSource(flipEl);
      flipSource.connect(audioCtx.destination);
    }
  } catch (e) {
    console.warn('AudioContext init failed — falling back to direct playback', e);
  }
}

/* ---------- Particle canvas (hearts + sparkles) ---------- */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let WIDTH = 0, HEIGHT = 0, particles = [];
function resizeCanvas(){
  WIDTH = canvas.width = innerWidth;
  HEIGHT = canvas.height = innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function random(min, max){ return Math.random()*(max-min)+min; }

class Particle {
  constructor(x,y,opts={}){
    this.x = x; this.y = y;
    this.vx = random(-0.3,0.3); this.vy = random(-1.2,-0.2);
    this.size = opts.size || random(8,22);
    this.life = opts.life || random(1600,3600);
    this.t = 0;
    this.alpha = 0;
    this.shape = opts.shape || (Math.random()>.5 ? 'heart' : 'spark');
    this.color = opts.color || (this.shape==='heart' ? `rgba(255,90,150,${random(0.6,1)})` : `rgba(255,220,240,${random(0.5,0.95)})`);
  }
  update(dt){
    this.t += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha = Math.min(1, this.t/200);
    if(this.t > this.life) this.alpha = Math.max(0, 1 - (this.t - this.life)/600);
  }
  draw(ctx){
    ctx.save();
    ctx.globalAlpha = this.alpha;
    if(this.shape === 'heart'){
      drawHeart(ctx, this.x, this.y, this.size, this.color);
    } else {
      drawSpark(ctx, this.x, this.y, this.size*0.6, this.color);
    }
    ctx.restore();
  }
}
function drawHeart(ctx,x,y,s,color){
  ctx.fillStyle = color;
  ctx.beginPath();
  const d = s/2;
  ctx.moveTo(x, y + d/2);
  ctx.bezierCurveTo(x, y - d/2, x - d, y - d/2, x - d, y + d/4);
  ctx.bezierCurveTo(x - d, y + d, x, y + d*1.4, x, y + d*1.8);
  ctx.bezierCurveTo(x, y + d*1.4, x + d, y + d, x + d, y + d/4);
  ctx.bezierCurveTo(x + d, y - d/2, x, y - d/2, x, y + d/2);
  ctx.closePath();
  ctx.fill();
}
function drawSpark(ctx,x,y,s,color){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, s*0.6, s*0.25, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, s*0.15, s*0.6, Math.PI/4, 0, Math.PI*2);
  ctx.fill();
}

let lastTime = performance.now();
function frame(now){
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  // clear
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  // spawn subtle upward particles from bottom
  if(Math.random() < 0.08) {
    particles.push(new Particle(random(20, WIDTH-20), HEIGHT + 10, {size: random(8,18), shape: Math.random()>0.6 ? 'heart' : 'spark'}));
  }
  // update
  particles.forEach(p => p.update(dt));
  // draw and filter out dead ones
  particles = particles.filter(p => p.t < p.life + 800);
  for(let p of particles) p.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- UX: Play control & opening sequence ---------- */
let opened = false;
playControl.addEventListener('click', async (e) => {
  playControl.setAttribute('aria-pressed','true');
  // init audio context on first user gesture
  await initAudio();
  if(audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch(e) { console.warn('resume failed',e); }
  }
  // try to play music element
  try {
    await musicElPlay();
  } catch (err) {
    console.warn('music play failed', err);
    // fallback: show a hint and keep book visible
  }
  // animate play control out
  playControl.animate([{ transform:'scale(1)'},{ transform:'scale(.96)'},{ opacity:0}], {duration:420, easing:'cubic-bezier(.2,.9,.25,1)'});
  setTimeout(()=> playControl.classList.add('hidden'), 420);

  // open book
  setTimeout(()=> {
    openBook();
  }, 380);
});

async function musicElPlay(){
  // Use the media element directly (connected to AudioContext), makes mobile reliable
  try {
    await musicEl.play();
  } catch(e){
    // If element playback rejected, attempt resume of audioCtx and then play
    if(audioCtx) {
      try { await audioCtx.resume(); await musicEl.play(); } catch(err){ throw err; }
    } else throw e;
  }
}

/* ---------- Book open & flipping ---------- */
function openBook(){
  // show book wrap
  bookWrap.classList.remove('hidden');
  // add class to stage for cover tilt
  document.querySelector('.book-shelf').classList.add('book-open');
  // small delay then flip pages sequentially
  let i = 0;
  function flipNext(){
    if(i >= pages.length){
      // close book and show final
      setTimeout(() => { closeBookAndShowFinal(); }, 900);
      return;
    }
    const pg = pages[i];
    // sound
    try{ flipEl.currentTime = 0; flipEl.play(); }catch(e){}
    // particle burst at center of page
    burstParticles(window.innerWidth/2, window.innerHeight/2 - 30, 14);
    // animate page flip
    pg.classList.add('flipping');
    pg.addEventListener('transitionend', function te(){ pg.removeEventListener('transitionend',te); });
    i++;
    setTimeout(flipNext, CONFIG.pageFlipDelay);
  }
  // show pages container
  document.querySelector('#bookWrap').classList.remove('hidden');
  // small delay then start
  setTimeout(flipNext, 700);
}

function closeBookAndShowFinal(){
  // small confetti + particles
  confettiBurst(CONFIG.finalConfettiCount);
  // hide book area
  document.querySelector('#bookWrap').classList.add('hidden');
  // reveal final card
  setTimeout(()=> {
    finalScreen.classList.remove('hidden');
    finalScreen.scrollIntoView({behavior:'smooth',block:'center'});
  }, 500);
}

/* ---------- Particles helpers ---------- */
function burstParticles(cx, cy, count){
  for(let i=0;i<count;i++){
    const p = new Particle(cx + random(-30,30), cy + random(-12,12), {size: random(6,20), life: random(800,1400), shape: Math.random()>0.4 ? 'heart' : 'spark'});
    // push upward/outward
    const angle = random(-Math.PI,0);
    p.vx = Math.cos(angle) * random(0.6,3.2);
    p.vy = Math.sin(angle) * random(-6,-2);
    particles.push(p);
  }
}

/* simple confetti: many small sparks */
function confettiBurst(n){
  for(let i=0;i<n;i++){
    const p = new Particle(random(100, innerWidth-100), random(innerHeight*0.2, innerHeight*0.6), {size: random(6,14), life: random(1800,3200), shape:'spark', color:`rgba(${200+Math.round(Math.random()*55)},${130+Math.round(Math.random()*80)},${200+Math.round(Math.random()*30)},${0.9})`});
    p.vx = random(-2.5,2.5);
    p.vy = random(-6,-2);
    particles.push(p);
  }
}

/* ---------- Keyboard accessibility: open/flip with Enter/Space ---------- */
book.addEventListener('keydown', (ev)=>{
  if(ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    // start flipping if not already
    if(!document.querySelector('.book-shelf').classList.contains('book-open')){
      openBook();
    }
  }
});

/* ---------- Fallback: ensure music element id (musicEl) defined ---------- */
const musicEl = document.getElementById('music') || new Audio(CONFIG.musicFile);
const pageFlipAudioEl = document.getElementById('pageFlipAudio') || new Audio(CONFIG.flipFile);

/* preload: hint to browser */
musicEl.preload = 'auto';
if (flipEl) flipEl.preload = 'auto';

/* ---------- end of script ---------- */
