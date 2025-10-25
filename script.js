// Elements
const startBtn = document.getElementById('startButton');
const postcard = document.getElementById('postcard');
const bookContainer = document.getElementById('bookContainer');
const bookPages = document.querySelectorAll('.page');
const finalScreen = document.getElementById('finalScreen');
const music = document.getElementById('birthdayMusic');
const flipSound = document.getElementById('flipSound');

// Particle canvas
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// Particle class
class Particle {
  constructor() {
    this.x = Math.random()*canvas.width;
    this.y = canvas.height + 10;
    this.vx = (Math.random()-0.5)*1.2;
    this.vy = -Math.random()*2 -0.5;
    this.size = Math.random()*15 +5;
    this.alpha = Math.random()*0.7+0.3;
    const emojis = ['💖','⭐','🎂','✨','🎈'];
    this.emoji = emojis[Math.floor(Math.random()*emojis.length)];
  }
  update(){ this.x += this.vx; this.y += this.vy; if(this.y < -50){ this.y = canvas.height+10; this.x = Math.random()*canvas.width; } }
  draw(){ ctx.globalAlpha=this.alpha; ctx.font=this.size+"px serif"; ctx.fillText(this.emoji,this.x,this.y); ctx.globalAlpha=1; }
}

// Animate particles
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(particles.length<60) particles.push(new Particle());
  particles.forEach(p=>{ p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
animate();

// Start celebration
startBtn.addEventListener('click', async ()=>{
  postcard.classList.add('hidden');
  bookContainer.classList.remove('hidden');
  try{ await music.play(); }catch(e){ console.warn("Autoplay blocked"); }

  let i=0;
  const interval = setInterval(()=>{
    if(i<bookPages.length){
      flipSound.currentTime=0; flipSound.play();
      bookPages[i].classList.add('flipped');
      i++;
    } else {
      clearInterval(interval);
      setTimeout(()=>{
        bookContainer.classList.add('hidden');
        finalScreen.classList.remove('hidden');
      },800);
    }
  },1800);
});
