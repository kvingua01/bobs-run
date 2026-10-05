const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const roomInfo = document.getElementById("roomInfo");
const message = document.getElementById("message");
const hud = document.getElementById("hud");
const bigMessage = document.getElementById("bigMessage");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let room = null;
let playerNumber = null;
let gameStarted = false;
let cameraX = 0;

const WORLD_WIDTH = 6500;

const player = {
  x: 100,
  y: 400,
  width: 38,
  height: 50,
  vx: 0,
  vy: 0,
  speed: 6,
  jump: 15,
  grounded: false,
  slowedUntil: 0
};

const opponent = {
  x: 140,
  y: 400,
  width: 38,
  height: 50
};

const keys = {};


// ======================================================
// PLATFORMS
// Every platform varies in size, height, and appearance.
// ======================================================

const platforms = [

  // START
  { x: 0, y: 600, w: 650, h: 80, style: 0 },

  // SECTION 1
  { x: 720, y: 550, w: 180, h: 130, style: 1 },
  { x: 980, y: 475, w: 240, h: 35, style: 2 },

  // SLOW DETOUR PLATFORM
  { x: 780, y: 370, w: 110, h: 25, style: 6 },

  // SECTION 2
  { x: 1300, y: 600, w: 500, h: 80, style: 3 },

  { x: 1870, y: 520, w: 130, h: 35, style: 4 },

  { x: 2070, y: 445, w: 210, h: 40, style: 5 },

  // SLOW DETOUR
  { x: 2190, y: 300, w: 100, h: 25, style: 7 },

  // SECTION 3
  { x: 2360, y: 600, w: 370, h: 80, style: 6 },

  { x: 2800, y: 535, w: 120, h: 145, style: 7 },

  { x: 2990, y: 455, w: 270, h: 35, style: 0 },

  // SLOW DETOUR
  { x: 3070, y: 300, w: 100, h: 25, style: 3 },

  // SECTION 4
  { x: 3340, y: 600, w: 420, h: 80, style: 1 },

  { x: 3830, y: 500, w: 160, h: 35, style: 2 },

  { x: 4070, y: 410, w: 200, h: 40, style: 3 },

  // SLOW DETOUR
  { x: 4160, y: 260, w: 100, h: 25, style: 6 },

  // SECTION 5
  { x: 4350, y: 545, w: 140, h: 135, style: 4 },

  { x: 4560, y: 600, w: 420, h: 80, style: 5 },

  { x: 5050, y: 500, w: 180, h: 35, style: 6 },

  { x: 5310, y: 430, w: 160, h: 35, style: 7 },

  // SLOW DETOUR
  { x: 5350, y: 280, w: 100, h: 25, style: 2 },

  // FINAL SECTION
  { x: 5550, y: 600, w: 300, h: 80, style: 0 },

  { x: 5920, y: 520, w: 160, h: 35, style: 1 },

  { x: 6150, y: 600, w: 350, h: 80, style: 2 }
];


// ======================================================
// SPIKES
// ======================================================

const spikes = [

  { x: 470, y: 570, w: 80, h: 30 },

  { x: 1500, y: 570, w: 80, h: 30 },

  { x: 2540, y: 570, w: 80, h: 30 },

  { x: 3520, y: 570, w: 80, h: 30 },

  { x: 4740, y: 570, w: 80, h: 30 },

  { x: 5650, y: 570, w: 80, h: 30 }

];


// ======================================================
// SPRINGS
// ======================================================

const springs = [

  { x: 590, y: 565, w: 45, h: 35 },

  { x: 1710, y: 565, w: 45, h: 35 },

  { x: 2660, y: 565, w: 45, h: 35 },

  { x: 3680, y: 565, w: 45, h: 35 },

  { x: 4910, y: 565, w: 45, h: 35 },

  { x: 5790, y: 565, w: 45, h: 35 }

];


// ======================================================
// SLOW POWERUPS
//
// These are intentionally OFF the fastest route.
// You have to take a detour to get them.
// ======================================================

const powerups = [

  {
    x: 835,
    y: 330,
    r: 18,
    used: false
  },

  {
    x: 2240,
    y: 260,
    r: 18,
    used: false
  },

  {
    x: 3120,
    y: 260,
    r: 18,
    used: false
  },

  {
    x: 4210,
    y: 220,
    r: 18,
    used: false
  },

  {
    x: 5400,
    y: 240,
    r: 18,
    used: false
  }

];


// ======================================================
// RESET PLAYER
// ======================================================

function resetPlayer() {

  player.x = Math.max(
    50,
    player.x - 250
  );

  player.y = 300;

  player.vx = 0;
  player.vy = 0;

}


// ======================================================
// COLLISION CHECK
// ======================================================

function rectangleHit(a, b) {

  return (

    a.x < b.x + b.w &&

    a.x + a.width > b.x &&

    a.y < b.y + b.h &&

    a.y + a.height > b.y

  );

}


// ======================================================
// CREATE ROOM
// ======================================================

document.getElementById("createButton").onclick = () => {

  socket.emit("createRoom");

};


// ======================================================
// JOIN ROOM
// ======================================================

document.getElementById("joinButton").onclick = () => {

  const code =
    document
      .getElementById("roomInput")
      .value;

  socket.emit(
    "joinRoom",
    code
  );

};


// ======================================================
// ROOM CREATED
// ======================================================

socket.on(
  "roomCreated",
  data => {

    room = data.code;

    playerNumber =
      data.playerNumber;

    roomInfo.innerHTML =
      "ROOM CODE: <b>" +
      room +
      "</b>";

    message.textContent =
      "Give this code to your friend!";

  }
);


// ======================================================
// ROOM JOINED
// ======================================================

socket.on(
  "roomJoined",
  data => {

    room = data.code;

    playerNumber =
      data.playerNumber;

  }
);


// ======================================================
// JOIN ERROR
// ======================================================

socket.on(
  "joinError",
  text => {

    message.textContent = text;

  }
);


// ======================================================
// START GAME
// ======================================================

socket.on(
  "startGame",
  () => {

    gameStarted = true;

    menu.style.display =
      "none";

    if (playerNumber === 1) {

      player.x = 100;

      opponent.x = 150;

    }

    else {

      player.x = 150;

      opponent.x = 100;

    }

  }
);


// ======================================================
// OTHER PLAYER MOVEMENT
// ======================================================

socket.on(
  "opponentUpdate",
  data => {

    opponent.x = data.x;

    opponent.y = data.y;

  }
);


// ======================================================
// GET SLOWED
// ======================================================

socket.on(
  "getSlowed",
  () => {

    player.slowedUntil =
      Date.now() + 3500;

    bigMessage.textContent =
      "SLOWED!";

    setTimeout(
      () => {

        bigMessage.textContent =
          "";

      },
      1000
    );

  }
);


// ======================================================
// OTHER PLAYER WINS
// ======================================================

socket.on(
  "opponentWon",
  () => {

    bigMessage.textContent =
      "OTHER PLAYER WINS!";

    gameStarted = false;

  }
);


// ======================================================
// OTHER PLAYER LEAVES
// ======================================================

socket.on(
  "opponentLeft",
  () => {

    bigMessage.textContent =
      "OTHER PLAYER LEFT";

  }
);


// ======================================================
// CONTROLS
// ======================================================

document.addEventListener(
  "keydown",
  e => {

    keys[e.code] = true;

  }
);


document.addEventListener(
  "keyup",
  e => {

    keys[e.code] = false;

  }
);


// ======================================================
// UPDATE GAME
// ======================================================

function update() {

  if (!gameStarted) {
    return;
  }


  // ------------------------------
  // SLOW EFFECT
  // ------------------------------

  const slowed =
    Date.now() <
    player.slowedUntil;


  const moveSpeed =
    slowed
      ? player.speed * 0.45
      : player.speed;


  // ------------------------------
  // LEFT / RIGHT
  // ------------------------------

  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) {

    player.vx =
      -moveSpeed;

  }

  else if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) {

    player.vx =
      moveSpeed;

  }

  else {

    player.vx *= 0.75;

  }


  // ------------------------------
  // JUMP
  // ------------------------------

  if (

    (
      keys["KeyW"] ||
      keys["ArrowUp"] ||
      keys["Space"]
    )

    && player.grounded

  ) {

    player.vy =
      -player.jump;

    player.grounded =
      false;

  }


  // ------------------------------
  // GRAVITY
  // ------------------------------

  player.vy += 0.75;


  // ------------------------------
  // MOVEMENT
  // ------------------------------

  player.x += player.vx;

  player.y += player.vy;


  if (player.x < 0) {

    player.x = 0;

  }


  player.grounded =
    false;


  // ==================================================
  // PLATFORM COLLISIONS
  // ==================================================

  for (
    const platform
    of platforms
  ) {

    const wasAbove =

      player.y +
      player.height -
      player.vy

      <= platform.y;


    if (

      rectangleHit(
        player,
        platform
      )

      &&

      player.vy >= 0

      &&

      wasAbove

    ) {

      player.y =

        platform.y -
        player.height;


      player.vy = 0;


      player.grounded =
        true;

    }

  }


  // ==================================================
  // SPIKES
  // ==================================================

  for (
    const spike
    of spikes
  ) {

    if (
      rectangleHit(
        player,
        spike
      )
    ) {

      resetPlayer();

    }

  }


  // ==================================================
  // SPRINGS
  // ==================================================

  for (
    const spring
    of springs
  ) {

    if (
      rectangleHit(
        player,
        spring
      )
    ) {

      player.vy = -22;

      player.y =

        spring.y -
        player.height;

    }

  }


  // ==================================================
  // SLOW POWERUPS
  // ==================================================

  for (
    const power
    of powerups
  ) {

    if (power.used) {
      continue;
    }


    const dx =

      player.x +
      player.width / 2 -
      power.x;


    const dy =

      player.y +
      player.height / 2 -
      power.y;


    const distance =

      Math.sqrt(
        dx * dx +
        dy * dy
      );


    if (distance < 40) {

      power.used = true;


      socket.emit(
        "slowOpponent",
        room
      );


      bigMessage.textContent =
        "SLOW ATTACK!";


      setTimeout(
        () => {

          bigMessage.textContent =
            "";

        },
        900
      );

    }

  }


  // ==================================================
  // FALL OFF MAP
  // ==================================================

  if (
    player.y >
    canvas.height + 300
  ) {

    resetPlayer();

  }


  // ==================================================
  // FINISH LINE
  // ==================================================

  if (
    player.x >
    WORLD_WIDTH - 180
  ) {

    bigMessage.textContent =
      "YOU WIN!";


    socket.emit(
      "playerWon",
      room
    );


    gameStarted = false;

  }


  // ==================================================
  // CAMERA
  // ==================================================

  cameraX =

    player.x -
    canvas.width * 0.35;


  cameraX =

    Math.max(

      0,

      Math.min(

        cameraX,

        WORLD_WIDTH -
        canvas.width

      )

    );


  // ==================================================
  // SEND POSITION TO OTHER PLAYER
  // ==================================================

  socket.emit(
    "playerUpdate",
    {

      room: room,

      x: player.x,

      y: player.y,

      vx: player.vx,

      vy: player.vy

    }
  );


  // ==================================================
  // HUD
  // ==================================================

  hud.innerHTML =

    "ROOM: " +
    room +

    "<br>PLAYER " +
    playerNumber +

    "<br>DISTANCE: " +
    Math.floor(player.x) +

    " / " +
    WORLD_WIDTH +

    (
      slowed
        ? "<br>SLOWED!"
        : ""
    );

}


// ======================================================
// BACKGROUND
// ======================================================

function drawBackground() {

  ctx.fillStyle =
    "#18213b";


  ctx.fillRect(

    0,
    0,

    canvas.width,
    canvas.height

  );


  // DISTANT MOUNTAINS

  ctx.fillStyle =
    "#222e51";


  for (
    let x = 0;
    x < WORLD_WIDTH;
    x += 400
  ) {

    const screenX =

      x -
      cameraX * 0.25;


    ctx.beginPath();


    ctx.moveTo(
      screenX,
      600
    );


    ctx.lineTo(
      screenX + 200,
      300
    );


    ctx.lineTo(
      screenX + 400,
      600
    );


    ctx.fill();

  }

}


// ======================================================
// DRAW DIFFERENT PLATFORM STYLES
// ======================================================

function drawPlatform(p) {

  const styles = [

    ["#53688f", "#72d572"],

    ["#704c3c", "#9ce36b"],

    ["#43516f", "#6ed6ff"],

    ["#68436f", "#e18bff"],

    ["#806737", "#ffd65a"],

    ["#3e6b61", "#78e0c4"],

    ["#6f3f45", "#ff7d84"],

    ["#4c4c4c", "#d7d7d7"]

  ];


  const style =

    styles[
      p.style %
      styles.length
    ];


  // MAIN PLATFORM

  ctx.fillStyle =
    style[0];


  ctx.fillRect(

    p.x,
    p.y,

    p.w,
    p.h

  );


  // TOP EDGE

  ctx.fillStyle =
    style[1];


  ctx.fillRect(

    p.x,
    p.y,

    p.w,
    10

  );


  // DETAILS

  ctx.fillStyle =
    "rgba(255,255,255,0.12)";


  for (

    let x =
      p.x + 12;

    x <
      p.x +
      p.w -
      10;

    x += 35

  ) {

    ctx.fillRect(

      x,

      p.y + 18,

      15,

      5

    );

  }

}


// ======================================================
// DRAW GAME
// ======================================================

function draw() {

  drawBackground();


  ctx.save();


  ctx.translate(
    -cameraX,
    0
  );


  // ==================================================
  // PLATFORMS
  // ==================================================

  for (
    const p
    of platforms
  ) {

    drawPlatform(p);

  }


  // ==================================================
  // SPIKES
  // ==================================================

  ctx.fillStyle =
    "#ff4c5e";


  for (
    const s
    of spikes
  ) {

    const count =

      Math.floor(
        s.w / 20
      );


    for (

      let i = 0;

      i < count;

      i++

    ) {

      ctx.beginPath();


      ctx.moveTo(

        s.x +
        i * 20,

        s.y +
        s.h

      );


      ctx.lineTo(

        s.x +
        i * 20 +
        10,

        s.y

      );


      ctx.lineTo(

        s.x +
        i * 20 +
        20,

        s.y +
        s.h

      );


      ctx.fill();

    }

  }


  // ==================================================
  // SPRINGS
  // ==================================================

  for (
    const s
    of springs
  ) {

    // SPRING BODY

    ctx.fillStyle =
      "#ffd43b";


    ctx.fillRect(

      s.x,
      s.y,

      s.w,
      s.h

    );


    // SPRING TOP

    ctx.fillStyle =
      "#ff8c32";


    ctx.fillRect(

      s.x,
      s.y,

      s.w,
      8

    );


    // SPRING LINES

    ctx.strokeStyle =
      "#8b5a00";

    ctx.lineWidth = 3;


    ctx.beginPath();


    ctx.moveTo(
      s.x + 8,
      s.y + 12
    );


    ctx.lineTo(
      s.x + 35,
      s.y + 20
    );


    ctx.lineTo(
      s.x + 8,
      s.y + 28
    );


    ctx.stroke();

  }


  // ==================================================
  // SLOW POWERUPS
  // ==================================================

  for (
    const p
    of powerups
  ) {

    if (p.used) {
      continue;
    }


    // OUTER GLOW

    ctx.fillStyle =
      "rgba(189,101,255,0.25)";


    ctx.beginPath();


    ctx.arc(

      p.x,
      p.y,

      p.r + 10,

      0,
      Math.PI * 2

    );


    ctx.fill();


    // POWERUP

    ctx.fillStyle =
      "#bd65ff";


    ctx.beginPath();


    ctx.arc(

      p.x,
      p.y,

      p.r,

      0,
      Math.PI * 2

    );


    ctx.fill();


    // S LETTER

    ctx.fillStyle =
      "white";


    ctx.font =
      "bold 20px Arial";


    ctx.textAlign =
      "center";


    ctx.fillText(

      "S",

      p.x,

      p.y + 7

    );

  }


  // ==================================================
  // FINISH LINE
  // ==================================================

  ctx.fillStyle =
    "white";


  ctx.fillRect(

    WORLD_WIDTH - 120,

    250,

    12,

    350

  );


  // CHECKERED FLAG

  for (
    let row = 0;
    row < 6;
    row++
  ) {

    for (
      let col = 0;
      col < 4;
      col++
    ) {

      if (
        (row + col) % 2 === 0
      ) {

        ctx.fillStyle =
          "white";

      }

      else {

        ctx.fillStyle =
          "black";

      }


      ctx.fillRect(

        WORLD_WIDTH -
        108 +
        col * 20,

        250 +
        row * 20,

        20,
        20

      );

    }

  }


  // ==================================================
  // OTHER PLAYER
  // ==================================================

  ctx.fillStyle =
    "#ff5757";


  ctx.fillRect(

    opponent.x,
    opponent.y,

    opponent.width,
    opponent.height

  );


  // OTHER PLAYER EYES

  ctx.fillStyle =
    "white";


  ctx.fillRect(

    opponent.x + 22,

    opponent.y + 10,

    7,
    7

  );


  ctx.fillStyle =
    "black";


  ctx.fillRect(

    opponent.x + 25,

    opponent.y + 12,

    3,
    3

  );


  // ==================================================
  // YOUR PLAYER
  // ==================================================

  ctx.fillStyle =
    "#49a7ff";


  ctx.fillRect(

    player.x,
    player.y,

    player.width,
    player.height

  );


  // YOUR EYE

  ctx.fillStyle =
    "white";


  ctx.fillRect(

    player.x + 22,

    player.y + 10,

    7,
    7

  );


  ctx.fillStyle =
    "black";


  ctx.fillRect(

    player.x + 25,

    player.y + 12,

    3,
    3

  );


  ctx.restore();

}


// ======================================================
// GAME LOOP
// ======================================================

function gameLoop() {

  update();

  draw();

  requestAnimationFrame(
    gameLoop
  );

}


gameLoop();
