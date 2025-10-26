// --- firebase config (dari kamu) ---
const firebaseConfig = {
  apiKey: "AIzaSyADPcpfjjMXqv3DmBR9tmQ7_x0NtwvLB08",
  authDomain: "kayyy-3588f.firebaseapp.com",
  databaseURL: "https://kayyy-3588f-default-rtdb.firebaseio.com",
  projectId: "kayyy-3588f",
  storageBucket: "kayyy-3588f.firebasestorage.app",
  messagingSenderId: "304987329935",
  appId: "1:304987329935:web:db3a9d952a5c790133a7fa",
  measurementId: "G-F8YPNQXGSD"
};
// init firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- QUESTIONS (ubah correct: index 0..3 untuk jawaban yang benar) ---
const questions = [
  {q:'Di kota mana aku lahir?', img:'city.png', a:['Jakarta','Bandung','Surabaya','Yogyakarta'], correct:0},
  {q:'Makanan favoritku apa?', img:'food.png', a:['Nasi goreng','Sushi','Pizza','Rendang'], correct:3},
  {q:'Hobi apa yang sering kulakukan di waktu luang?', img:'game.png', a:['Membaca','Bermain game','Berkebun','Olahraga'], correct:1},
  {q:'Warna favoritku?', img:'color.png', a:['Merah','Biru','Hitam','Hijau'], correct:2},
  {q:'Siapa nama hewan peliharaanku (jika ada)?', img:'pet.png', a:['Kiko','Bello','Momo','(Tidak punya)'], correct:3},
  {q:'Genre musik yang kusuka?', img:'music.png', a:['Pop','Rock','Klasik','EDM'], correct:0},
  {q:'Minuman pagi favoritku?', img:'coffee.png', a:['Kopi','Teh','Jus','Susu'], correct:0},
  {q:'Aku lebih suka liburan ke...', img:'beach.png', a:['Pantai','Gunung','Kota besar','Desa'], correct:1},
  {q:'Aku paling takut dengan...', img:'fear.png', a:['Ketinggian','Gelap','Ular','Tertinggal'], correct:0},
  {q:'Aku biasanya bangun jam berapa?', img:'alarm.png', a:['05:00','07:00','09:00','11:00'], correct:1}
];

let answers = Array(questions.length).fill(null);
let indexQ = 0;
let player = '';

// audio & UI
const audio = document.getElementById('bgm');
const musicToggle = document.getElementById('musicToggle');
const introCard = document.getElementById('intro');
const nameInput = document.getElementById('name');

// autoplay helper (browsers may block autoplay; user can press toggle)
function tryPlayMusic(){
  audio.play().catch(()=>{ /* autoplay blocked; user can press ▶ */ });
}
function stopMusic(){ audio.pause(); audio.currentTime = 0; }

// music toggle button
musicToggle.addEventListener('click', ()=>{
  if(audio.paused){ audio.play(); musicToggle.textContent = '⏸'; }
  else{ audio.pause(); musicToggle.textContent = '▶'; }
});

// focus animation for name input
nameInput.addEventListener('focus', ()=>{ introCard.classList.add('enter'); });
nameInput.addEventListener('blur', ()=>{ introCard.classList.remove('enter'); });

// Start / nav
document.getElementById('startBtn').addEventListener('click', startQuiz);
document.getElementById('nextBtn').addEventListener('click', nextQ);
document.getElementById('prevBtn').addEventListener('click', prevQ);

function startQuiz(){
  player = nameInput.value.trim();
  if(!player){ alert('Masukkan nama dulu!'); return; }
  introCard.style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  indexQ = 0;
  answers = Array(questions.length).fill(null);
  showQ();
  tryPlayMusic();
}

function showQ(){
  const q = questions[indexQ];
  document.getElementById('qnum').innerText = `Pertanyaan ${indexQ+1}/${questions.length}`;
  document.getElementById('qimg').src = 'img/' + q.img;
  document.getElementById('question').innerText = q.q;
  const box = document.getElementById('answers'); box.innerHTML = '';
  q.a.forEach((opt,i)=>{
    const el = document.createElement('div');
    el.className = 'choice' + (answers[indexQ]===i ? ' selected' : '');
    el.innerText = String.fromCharCode(65+i) + '. ' + opt;
    el.onclick = ()=>{ answers[indexQ] = i; showQ(); };
    box.appendChild(el);
  });
  document.getElementById('prevBtn').disabled = (indexQ === 0);
  document.getElementById('nextBtn').innerText = (indexQ === questions.length-1) ? 'Selesai' : 'Selanjutnya';
}

function nextQ(){
  if(indexQ < questions.length-1){ indexQ++; showQ(); }
  else finish();
}
function prevQ(){ if(indexQ>0){ indexQ--; showQ(); } }

function finish(){
  let score = 0;
  for(let i=0;i<questions.length;i++){ if(answers[i] === questions[i].correct) score++; }
  document.getElementById('quiz').style.display = 'none';
  document.getElementById('result').style.display = 'block';
  document.getElementById('score').innerText = `${player}, skor kamu ${score}/${questions.length}`;
  document.getElementById('rating').innerText = `Rating ${score}/${questions.length}`;

  // push to firebase leaderboard
  const entry = { name: player, score: score, time: Date.now() };
  db.ref('leaderboard').push(entry).catch(err=>console.error('Save error', err));

  // spawn confetti (pink & white)
  spawnConfetti(40);

  // start listening for updates and render
  db.ref('leaderboard').on('value', snapshot => {
    const data = snapshot.val() || {};
    const arr = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    arr.sort((a,b) => b.score - a.score || a.time - b.time);
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';
    arr.forEach((p, idx) => {
      const el = document.createElement('div');
      el.className = 'leader-item';
      el.innerHTML = `<div class="name">${idx+1}. ${p.name}</div><div class="score">${p.score}/${questions.length}</div>`;
      container.appendChild(el);
    });
  });
}

// initial load of leaderboard (so visitors can see it before playing)
db.ref('leaderboard').once('value').then(snapshot=>{
  const data = snapshot.val() || {};
  const arr = Object.keys(data).map(k => ({ id: k, ...data[k] }));
  arr.sort((a,b) => b.score - a.score || a.time - b.time);
  const container = document.getElementById('leaderboard'); container.innerHTML = '';
  arr.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'leader-item';
    el.innerHTML = `<div class="name">${idx+1}. ${p.name}</div><div class="score">${p.score}/${questions.length}</div>`;
    container.appendChild(el);
  });
}).catch(e => console.error(e));

// confetti helper
function spawnConfetti(n){
  const colors = ['#ff9db4','#ffd9e6','#ffffff'];
  for(let i=0;i<n;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = (10 + Math.random()*80) + '%';
    el.style.background = colors[i % colors.length];
    el.style.width = (6 + Math.random()*10) + 'px';
    el.style.height = (8 + Math.random()*16) + 'px';
    el.style.borderRadius = (Math.random()*3) + 'px';
    el.style.top = (-10 - Math.random()*10) + 'vh';
    el.style.animation = 'fall ' + (3 + Math.random()*2) + 's linear forwards';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 6000);
  }
}

// pause music when tab hidden, resume (try) when visible
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'hidden'){ audio.pause(); }
  else { tryPlayMusic(); }
});
