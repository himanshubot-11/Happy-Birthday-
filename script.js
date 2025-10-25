const openBtn = document.getElementById('openDiary');
const diary = document.getElementById('diary');
const birthdayBox = document.getElementById('birthdayBox');
const pages = [document.getElementById('page1'), document.getElementById('page2'), document.getElementById('page3')];
const nextBtn = document.getElementById('nextPage');
const cakePopup = document.getElementById('cakePopup');
const floatingEmojis = document.querySelector('.floating-emojis');
const music = document.getElementById('birthdayMusic');

let currentPage = 0;

// Emoji types
const emojis = ['❤️','💕','💖','💘','💞','💓','❣️','💗','🎂','💋','✨','🎉'];

// Create floating emojis continuously
function createFloatingEmoji(){
  const span = document.createElement('span');
  span.innerText = emojis[Math.floor(Math.random()*emojis.length)];
  span.style.left = Math.random()*90 + 'vw';
  span.style.animationDuration = (8+Math.random()*5)+'s';
  floatingEmojis.appendChild(span);
  setTimeout(()=>floatingEmojis.removeChild(span),15000);
}
setInterval(createFloatingEmoji,300);

// Open diary and start music
openBtn.onclick = () => {
  birthdayBox.style.display='none';
  diary.style.display='block';
  pages[currentPage].style.display='block';
  music.play();
};

// Diary page navigation
nextBtn.onclick = ()=>{
  pages[currentPage].style.display='none';
  currentPage++;
  if(currentPage<pages.length){
    pages[currentPage].style.display='block';
  }else{
    diary.style.display='none';
    cakePopup.style.display='block';
  }
};
