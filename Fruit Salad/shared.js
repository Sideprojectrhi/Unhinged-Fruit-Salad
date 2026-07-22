/* ===================================================================
   SHARED GAME ENGINE — Fruit Salad
   Reusable across all modes (home, rant, roast)
   ===================================================================== */

const ANIMS = [
  "anim-squish","anim-wobble","anim-flop","anim-faint","anim-spin","anim-flex",
  "anim-sway","anim-dip","anim-robot","anim-worm","anim-buildup","anim-sad","anim-glitch",
  "anim-lean","anim-panic","anim-victory"
];

const CAST = [
  {
    id:"pineapple", img:"assets/pineapple.png",
    weightedActions:["anim-spin","anim-victory","anim-panic","anim-buildup","anim-glitch"],
    idleLines:[
      "I RAN HERE FOR NO REASON AND I'D DO IT AGAIN",
      "I have several emotions and all of them are loud",
      "spiky on the outside, spiky on the inside too actually",
      "not to be dramatic but I could destroy you in an argument",
      "I run this fruit bowl and everyone knows it"
    ],
    pokeLines:["WHO TOUCHED ME", "okay but why does that feel nice actually", "I'm calling my lawyer (I don't have one)", "bold move for someone who can't even peel me"]
  },
  {
    id:"melon", img:"assets/melon.png",
    weightedActions:["anim-sad","anim-lean","anim-flop","anim-sway"],
    idleLines:[
      "I've seen things",
      "everyone's running around and I simply will not be participating",
      "I'm not tired, I'm just built like this",
      "your other tabs are more interesting than this, probably",
      "I'd roast you but I don't want to exert myself"
    ],
    pokeLines:["...why", "I felt that in my rind", "was that necessary", "you have the attention span of a goldfish and it shows"]
  },
  {
    id:"peach", img:"assets/peach.png",
    weightedActions:["anim-dip","anim-buildup","anim-lean","anim-victory"],
    idleLines:[
      "everything's fine here, nothing to see, why are you looking at me like that",
      "I would never do anything wrong :)",
      `I think about you and then I think about other things too, mostly you though`,
      "I'm sweet until you disappoint me, then it's over",
      "cute exterior, unhinged interior, learn the difference"
    ],
    pokeLines:["oh?? okay??", "you can't just touch a peach and expect nothing to happen", "hehe. hehehe. anyway.", "I'll allow it this once"]
  },
  {
    id:"banana", img:"assets/banana.png",
    weightedActions:["anim-panic","anim-glitch","anim-wobble","anim-faint"],
    idleLines:[
      "IS THIS NORMAL. IS THIS A NORMAL AMOUNT OF EXISTING",
      "I saw a shadow and now I have to lie down",
      "everything is fine I am simply vibrating",
      "I have a bad feeling about today and every day honestly",
      "someone check on me. no reason. just do it"
    ],
    pokeLines:["AH — okay — hi — sorry — hi", "my heart cannot take this", "I need a minute. several minutes.", "was THAT called for??"]
  },
  {
    id:"strawberry", img:"assets/strawberry.png",
    weightedActions:["anim-squish","anim-spin","anim-panic","anim-flex"],
    idleLines:[
      "I could take any of these fruits in a fight and I will not be explaining why I think that",
      "small but I contain multitudes (rage, mostly)",
      "who's talking. was someone talking. I'll fight them too",
      "I peaked in a way none of you will ever understand",
      "say something. I dare you. I'm BEGGING you"
    ],
    pokeLines:["EXCUSE ME", "wanna go?? WANNA GO??", "okay that one was kind of fair", "you just unlocked beef with me, congrats"]
  },
  {
    id:"grape", img:"assets/grape.png",
    weightedActions:["anim-worm","anim-glitch","anim-robot","anim-panic","anim-spin"],
    idleLines:[
      "AAAAAA no reason just felt like screaming",
      "I crawled here on purpose I want that on record",
      "no thoughts just vibes and also mild chaos",
      "I don't have a personality I just have volume",
      "someone's about to get roasted and it might be you"
    ],
    pokeLines:["AAAAA", "again. do it again.", "*incomprehensible screaming*", "I felt that in my whole vine"]
  }
];

const VANGOGH = {
  painting: "assets/vangogh-painting.png",
  staring: "assets/vangogh-staring.png",
  splat: "assets/vangogh-splat.png",
  beret: "assets/vangogh-beret.png",
  idleLines:[
    "this brush is being difficult with me today",
    "I mixed a color that should not exist and now I must live with that",
    "*stares at the sky for an uncomfortably long time*",
    "the light is doing something and I must capture it immediately",
    "I have never once painted something normal and I don't plan to start",
    "art is suffering and also occasionally paint on my face"
  ],
  flinchLines:[
    "I heard that and I did not appreciate it",
    "the chaos is affecting my art, please be aware of that",
    "hm. yes. anyway."
  ],
  splatLines:["THE PAINT. WHY IS IT ON ME. IT SHOULD BE ON THE CANVAS.", "this happens more than I'd like to admit"],
  beretLines:["NOT AGAIN", "come BACK here", "one day I will own a hat that stays on my head"],
  pokeLines:["do NOT touch the artist", "I am WORKING", "the muse does not appreciate that, actually", "fine. FINE. I'll allow it.", "excuse you, I am creating something", "you again. of course."]
};

/* ===================================================================== */

function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

let audioCtx = null;
let ambientNodes = null;
let soundOn = false;

function startAmbient(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.value = 0.05;
  master.connect(audioCtx.destination);

  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine'; osc1.frequency.value = 110;
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine'; osc2.frequency.value = 164.8;
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine'; lfo.frequency.value = 0.08;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain); lfoGain.connect(master.gain);

  osc1.connect(master); osc2.connect(master);
  osc1.start(); osc2.start(); lfo.start();
  ambientNodes = { osc1, osc2, lfo, master };
}

function stopAmbient(){
  if(!ambientNodes) return;
  Object.values(ambientNodes).forEach(n => { try{ n.stop && n.stop(); n.disconnect(); }catch(e){} });
  ambientNodes = null;
}

function playPokeSound(){
  if(!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 300 + Math.random()*200;
  gain.gain.value = 0.06;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.stop(audioCtx.currentTime + 0.16);
}

/* ===================================================================== */

class Fruit{
  constructor(data, index, stage, stageW, stageH, TOP_SAFE, BOTTOM_SAFE, registerInteraction){
    this.data = data;
    this.stage = stage;
    this.stageW = stageW;
    this.stageH = stageH;
    this.TOP_SAFE = TOP_SAFE;
    this.BOTTOM_SAFE = BOTTOM_SAFE;
    this.registerInteraction = registerInteraction;

    this.el = document.createElement('div');
    this.el.className = 'fruit-pos';
    this.actor = document.createElement('div');
    this.actor.className = 'fruit-actor';
    const img = document.createElement('img');
    img.src = data.img;
    img.draggable = false;
    this.actor.appendChild(img);
    this.el.appendChild(this.actor);

    this.bubble = document.createElement('div');
    this.bubble.className = 'fruit-bubble';
    this.el.appendChild(this.bubble);
    this.bubbleTimer = null;

    stage.appendChild(this.el);

    this.x = 20 + Math.random()*Math.max(1, this.stageW()-84);
    this.y = this.TOP_SAFE + Math.random()*Math.max(1, this.stageH()-this.BOTTOM_SAFE-this.TOP_SAFE-64);
    this.vx = (Math.random()-0.5) * 0.15;
    this.vy = (Math.random()-0.5) * 0.15;
    this.dragging = false;
    this.lastAnimAt = 0;
    this.nextDirChange = performance.now() + 1000 + Math.random()*2000;
    this.nextIdleBeat = performance.now() + 3000 + Math.random()*4000;
    this.active = false;
    this.el.style.pointerEvents = 'none';

    this.bindEvents();
    this.render();
  }

  say(text, ms=4500){
    this.bubble.textContent = text;
    this.bubble.classList.add('show');
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(()=>{ this.bubble.classList.remove('show'); }, ms);
  }

  enter(){
    this.active = true;
    this.el.style.pointerEvents = 'auto';
    this.el.classList.add('visible');
    this.x = 20 + Math.random()*Math.max(1, this.stageW()-84);
    this.y = this.TOP_SAFE + Math.random()*Math.max(1, this.stageH()-this.BOTTOM_SAFE-this.TOP_SAFE-64);
    this.vx = (Math.random()-0.5) * 0.15;
    this.vy = (Math.random()-0.5) * 0.15;
    this.render();
    if(Math.random() < 0.8) this.say(randomFrom(this.data.idleLines));
  }

  exit(){
    this.active = false;
    this.el.style.pointerEvents = 'none';
    this.el.classList.remove('visible');
  }

  bindEvents(){
    let downX=0, downY=0, moved=false, offsetX=0, offsetY=0;

    this.el.addEventListener('pointerdown', (e)=>{
      this.el.setPointerCapture(e.pointerId);
      this.dragging = true;
      moved = false;
      this.el.classList.add('dragging');
      const rect = this.stage.getBoundingClientRect();
      downX = e.clientX; downY = e.clientY;
      offsetX = e.clientX - rect.left - this.x;
      offsetY = e.clientY - rect.top - this.y;
    });

    this.el.addEventListener('pointermove', (e)=>{
      if(!this.dragging) return;
      if(Math.abs(e.clientX-downX) > 4 || Math.abs(e.clientY-downY) > 4) moved = true;
      const rect = this.stage.getBoundingClientRect();
      this.x = clamp(e.clientX - rect.left - offsetX, 0, this.stageW()-this.el.offsetWidth);
      this.y = clamp(e.clientY - rect.top - offsetY, 0, this.stageH()-this.el.offsetHeight);
      this.render();
    });

    const endDrag = (e)=>{
      if(!this.dragging) return;
      this.dragging = false;
      this.el.classList.remove('dragging');
      if(!moved){
        this.poke();
      } else {
        this.playAnim(randomFrom(["anim-flop","anim-wobble","anim-squish"]));
        this.say(randomFrom(this.data.pokeLines));
        this.vx = (Math.random()-0.5) * 0.15;
        this.vy = (Math.random()-0.5) * 0.15;
        this.registerInteraction(5);
      }
    };
    this.el.addEventListener('pointerup', endDrag);
    this.el.addEventListener('pointercancel', endDrag);
  }

  poke(){
    this.playAnim('anim-poke');
    this.say(randomFrom(this.data.pokeLines));
    this.registerInteraction(8);
  }

  playAnim(cls){
    ANIMS.concat(['anim-poke']).forEach(c => this.actor.classList.remove(c));
    void this.actor.offsetWidth;
    this.actor.classList.add(cls);
    this.lastAnimAt = performance.now();
  }

  idleBeat(){
    const pool = this.data.weightedActions.concat(this.data.weightedActions).concat(ANIMS);
    this.playAnim(randomFrom(pool));
    if(Math.random() < 0.7){
      this.say(randomFrom(this.data.idleLines));
    }
  }

  render(){
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    if(this.vx !== 0){
      this.actor.style.transform2 = null;
      this.actor.style.setProperty('--facing', this.vx < 0 ? '-1' : '1');
      this.el.style.transform += ` `;
      this.actor.querySelector('img').style.transform = `scaleX(${this.vx < 0 ? -1 : 1})`;
    }
  }

  tick(now, dt){
    if(this.dragging || !this.active) return;

    if(now > this.nextDirChange){
      this.vx = (Math.random()-0.5) * 0.2;
      this.vy = (Math.random()-0.5) * 0.2;
      this.nextDirChange = now + 1500 + Math.random()*2500;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const maxX = this.stageW() - this.el.offsetWidth;
    const minY = this.TOP_SAFE;
    const maxY = this.stageH() - this.BOTTOM_SAFE - this.el.offsetHeight;
    if(this.x < 0){ this.x = 0; this.vx *= -1; }
    if(this.x > maxX){ this.x = maxX; this.vx *= -1; }
    if(this.y < minY){ this.y = minY; this.vy *= -1; }
    if(this.y > maxY){ this.y = maxY; this.vy *= -1; }

    if(now > this.nextIdleBeat){
      this.idleBeat();
      this.nextIdleBeat = now + 4000 + Math.random()*5000;
    }

    this.render();
  }
}

/* ===================================================================== */

class Painter{
  constructor(stage, stageW, stageH, TOP_SAFE, BOTTOM_SAFE, registerInteraction){
    this.stage = stage;
    this.stageW = stageW;
    this.stageH = stageH;
    this.TOP_SAFE = TOP_SAFE;
    this.BOTTOM_SAFE = BOTTOM_SAFE;
    this.registerInteraction = registerInteraction;

    this.el = document.createElement('div');
    this.el.className = 'vangogh-pos';

    this.inner = document.createElement('div');
    this.inner.className = 'vg-inner bob';
    this.inner.style.width = '100%';
    this.inner.style.height = '100%';

    this.img = document.createElement('img');
    this.img.src = VANGOGH.painting;
    this.img.draggable = false;
    this.inner.appendChild(this.img);
    this.el.appendChild(this.inner);

    this.bubble = document.createElement('div');
    this.bubble.className = 'vg-bubble';
    this.el.appendChild(this.bubble);

    stage.appendChild(this.el);

    this.anchorX = 24;
    this.anchorY = this.stageH() - this.BOTTOM_SAFE - 244;
    this.x = this.anchorX; this.y = this.anchorY;
    this.busy = false;
    this.dragging = false;
    this.bubbleTimer = null;
    this.bindEvents();
    this.render();
    this.nextBeat = performance.now() + 4000 + Math.random()*4000;
  }

  render(){ this.el.style.transform = `translate(${this.x}px,${this.y}px)`; }

  setPose(src){ this.img.src = src; }

  bindEvents(){
    let downX=0, downY=0, moved=false, offsetX=0, offsetY=0;

    this.el.addEventListener('pointerdown', (e)=>{
      this.el.setPointerCapture(e.pointerId);
      this.dragging = true;
      moved = false;
      this.el.classList.add('dragging');
      const rect = this.stage.getBoundingClientRect();
      downX = e.clientX; downY = e.clientY;
      offsetX = e.clientX - rect.left - this.x;
      offsetY = e.clientY - rect.top - this.y;
    });

    this.el.addEventListener('pointermove', (e)=>{
      if(!this.dragging) return;
      if(Math.abs(e.clientX-downX) > 4 || Math.abs(e.clientY-downY) > 4) moved = true;
      const rect = this.stage.getBoundingClientRect();
      this.x = clamp(e.clientX - rect.left - offsetX, 0, this.stageW()-this.el.offsetWidth);
      this.y = clamp(e.clientY - rect.top - offsetY, this.TOP_SAFE, this.stageH()-this.BOTTOM_SAFE-this.el.offsetHeight);
      this.render();
    });

    const endDrag = ()=>{
      if(!this.dragging) return;
      this.dragging = false;
      this.el.classList.remove('dragging');
      if(!moved){
        this.poke();
      } else {
        this.inner.classList.add('flinch');
        this.say(randomFrom(VANGOGH.pokeLines));
        setTimeout(()=>this.inner.classList.remove('flinch'), 500);
        this.anchorX = this.x;
        this.anchorY = this.y;
        this.registerInteraction(5);
      }
    };
    this.el.addEventListener('pointerup', endDrag);
    this.el.addEventListener('pointercancel', endDrag);
  }

  poke(){
    if(this.busy) return;
    this.inner.classList.add('flinch');
    this.say(randomFrom(VANGOGH.pokeLines));
    setTimeout(()=>this.inner.classList.remove('flinch'), 500);
    this.registerInteraction(8);
  }

  say(text, ms=5000){
    this.bubble.textContent = text;
    this.bubble.classList.add('show');
    this.el.classList.add('talk');
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(()=>{
      this.bubble.classList.remove('show');
      this.el.classList.remove('talk');
    }, ms);
  }

  idleMusing(){
    if(this.busy) return;
    this.setPose(VANGOGH.staring);
    this.say(randomFrom(VANGOGH.idleLines));
    setTimeout(()=>{ if(!this.busy) this.setPose(VANGOGH.painting); }, 1800);
  }

  flinch(){
    if(this.busy || this.dragging) return;
    this.inner.classList.add('flinch');
    this.say(randomFrom(VANGOGH.flinchLines), 1600);
    setTimeout(()=>{
      this.setPose(VANGOGH.splat);
      this.say(randomFrom(VANGOGH.splatLines));
    }, 350);
    setTimeout(()=>{
      this.inner.classList.remove('flinch');
      this.setPose(VANGOGH.painting);
    }, 1250);
  }

  chaseBeret(){
    if(this.busy) return;
    this.busy = true;
    this.setPose(VANGOGH.beret);
    this.say(randomFrom(VANGOGH.beretLines));
    const startX = this.x, startY = this.y;
    const targetX = clamp(this.x + (Math.random()>0.5 ? 90 : -90), 0, this.stageW()-this.el.offsetWidth);
    const targetY = clamp(this.y - 20, this.TOP_SAFE, this.stageH()-this.BOTTOM_SAFE-this.el.offsetHeight);
    const t0 = performance.now();
    const dur = 1400;
    const step = (now)=>{
      const p = Math.min(1, (now-t0)/dur);
      this.x = startX + (targetX-startX)*p;
      this.y = startY + (targetY-startY)*p;
      this.render();
      if(p<1) requestAnimationFrame(step);
      else {
        setTimeout(()=>{
          const back0 = performance.now();
          const bx = this.x, by = this.y;
          const stepBack = (now2)=>{
            const p2 = Math.min(1, (now2-back0)/dur);
            this.x = bx + (this.anchorX-bx)*p2;
            this.y = by + (this.anchorY-by)*p2;
            this.render();
            if(p2<1) requestAnimationFrame(stepBack);
            else { this.setPose(VANGOGH.painting); this.busy = false; }
          };
          requestAnimationFrame(stepBack);
        }, 500);
      }
    };
    requestAnimationFrame(step);
  }

  tick(now){
    if(this.dragging) return;
    if(now > this.nextBeat){
      const roll = Math.random();
      if(roll < 0.45) this.idleMusing();
      else if(roll < 0.7) this.chaseBeret();
      this.nextBeat = now + 5000 + Math.random()*5000;
    }
    this.render();
  }
}

/* ===================================================================== */

function runGameLoop(painter, fruits){
  let lastTime = performance.now();
  let lastCollisionAt = 0;

  function checkCollisions(now){
    if(now - lastCollisionAt < 1500) return;
    const onstage = fruits.filter(f => f.active && !f.dragging);
    for(let i=0;i<onstage.length;i++){
      for(let j=i+1;j<onstage.length;j++){
        const a = onstage[i], b = onstage[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 50){
          a.playAnim(randomFrom(a.data.weightedActions));
          b.playAnim(randomFrom(b.data.weightedActions));
          b.say(randomFrom(b.data.pokeLines));
          a.vx *= -1; a.vy *= -1; b.vx *= -1; b.vy *= -1;
          lastCollisionAt = now;
          if(Math.random() < 0.5) setTimeout(()=>painter.flinch(), 300);
          return;
        }
      }
    }
    for(const f of onstage){
      const dx = f.x - painter.x, dy = f.y - painter.y;
      if(Math.sqrt(dx*dx+dy*dy) < 55 && Math.random() < 0.02){
        painter.flinch();
        lastCollisionAt = now;
        break;
      }
    }
  }

  function loop(now){
    const dt = Math.min(40, now - lastTime);
    lastTime = now;
    fruits.forEach(f => f.tick(now, dt));
    painter.tick(now);
    checkCollisions(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ===================================================================== */

function initHamburgerMenu(){
  // Create hamburger button and menu
  const navBtn = document.createElement('button');
  navBtn.id = 'navMenuBtn';
  navBtn.title = 'menu';
  navBtn.textContent = '☰';
  document.body.appendChild(navBtn);

  const navMenu = document.createElement('nav');
  navMenu.id = 'navMenu';

  const pages = [
    {href: 'home.html', label: 'Home'},
    {href: 'rant.html', label: 'Rant'},
    {href: 'roast.html', label: 'Roast'}
  ];

  pages.forEach(page => {
    const link = document.createElement('a');
    link.href = page.href;
    link.className = 'nav-link';
    link.textContent = page.label;

    // Highlight active page
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    if(currentPage === page.href || (currentPage === '' && page.href === 'home.html')){
      link.classList.add('active');
    }

    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });

    navMenu.appendChild(link);
  });
  document.body.appendChild(navMenu);

  // Toggle menu on button click
  navBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('open');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if(!e.target.closest('#navMenuBtn') && !e.target.closest('#navMenu')){
      navMenu.classList.remove('open');
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && navMenu.classList.contains('open')){
      navMenu.classList.remove('open');
    }
  });
}

// Initialize hamburger menu on page load
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initHamburgerMenu);
}else{
  initHamburgerMenu();
}
