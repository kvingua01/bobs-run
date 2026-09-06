const socket = io();

const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const menu =
  document.getElementById("menu");

const roomInfo =
  document.getElementById("roomInfo");

const message =
  document.getElementById("message");

const hud =
  document.getElementById("hud");

const bigMessage =
  document.getElementById("bigMessage");


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

  x: 100,
  y: 400,

  width: 38,
  height: 50

};


const keys = {};


const platforms = [

  {x:0, y:600, w:900, h:80},

  {x:1000, y:600, w:700, h:80},

  {x:1800, y:600, w:800, h:80},

  {x:2700, y:600, w:700, h:80},

  {x:3500, y:600, w:900, h:80},

  {x:4550, y:600, w:700, h:80},

  {x:5400, y:600, w:1100, h:80},


  {x:500, y:470, w:180, h:25},

  {x:1250, y:430, w:180, h:25},

  {x:2050, y:460, w:180, h:25},

  {x:2900, y:410, w:220, h:25},

  {x:3750, y:450, w:180, h:25},

  {x:4700, y:400, w:220, h:25}

];


const spikes = [

  {x:720, y:570, w:70, h:30},

  {x:1450, y:570, w:80, h:30},

  {x:2300, y:570, w:80, h:30},

  {x:3200, y:570, w:80, h:30},

  {x:4150, y:570, w:90, h:30},

  {x:5000, y:570, w:80, h:30}

];


const springs = [

  {x:820, y:565, w:45, h:35},

  {x:1600, y:565, w:45, h:35},

  {x:2500, y:565, w:45, h:35},

  {x:3370, y:565, w:45, h:35},

  {x:4350, y:565, w:45, h:35},

  {x:5200, y:565, w:45, h:35}

];


const powerups = [

  {x:580, y:420, r:18, used:false},

  {x:1300, y:380, r:18, used:false},

  {x:2100, y:410, r:18, used:false},

  {x:3000, y:360, r:18, used:false},

  {x:3820, y:400, r:18, used:false},

  {x:4800, y:350, r:18, used:false}

];


function resetPlayer() {

  player.x =
    Math.max(50, player.x - 250);

  player.y = 300;

  player.vx = 0;

  player.vy = 0;

}


function rectangleHit(a, b) {

  return (

    a.x < b.x + b.w &&

    a.x + a.width > b.x &&

    a.y < b.y + b.h &&

    a.y + a.height > b.y

  );

}


document.getElementById("createButton").onclick =
() => {

  socket.emit("createRoom");

};


document.getElementById("joinButton").onclick =
() => {

  const code =
    document.getElementById("roomInput").value;

  socket.emit("joinRoom", code);

};


socket.on("roomCreated", data => {

  room = data.code;

  playerNumber = data.playerNumber;


  roomInfo.innerHTML =
    "ROOM CODE: <b>" +
    room +
    "</b>";


  message.textContent =
    "Give this code to your friend!";

});


socket.on("roomJoined", data => {

  room = data.code;

  playerNumber = data.playerNumber;

});


socket.on("joinError", text => {

  message.textContent = text;

});


socket.on("startGame", () => {

  gameStarted = true;

  menu.style.display = "none";


  if (playerNumber === 1) {

    player.x = 100;

    opponent.x = 140;

  }

  else {

    player.x = 140;

    opponent.x = 100;

  }

});


socket.on("opponentUpdate", data => {

  opponent.x = data.x;

  opponent.y = data.y;

});


socket.on("getSlowed", () => {

  player.slowedUntil =
    Date.now() + 3500;


  bigMessage.textContent =
    "SLOWED!";


  setTimeout(() => {

    bigMessage.textContent = "";

  }, 1000);

});


socket.on("opponentWon", () => {

  bigMessage.textContent =
    "OTHER PLAYER WINS!";

});


socket.on("opponentLeft", () => {

  bigMessage.textContent =
    "OTHER PLAYER LEFT";

});


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


function update() {

  if (!gameStarted) {
    return;
  }


  const slowed =
    Date.now() < player.slowedUntil;


  const moveSpeed =
    slowed
      ? player.speed * 0.45
      : player.speed;


  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) {

    player.vx = -moveSpeed;

  }

  else if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) {

    player.vx = moveSpeed;

  }

  else {

    player.vx *= 0.75;

  }


  if (

    (
      keys["KeyW"] ||
      keys["ArrowUp"] ||
      keys["Space"]
    )

    && player.grounded

  ) {

    player.vy = -player.jump;

    player.grounded = false;

  }


  // GRAVITY

  player.vy += 0.75;


  // MOVEMENT

  player.x += player.vx;

  player.y += player.vy;


  if (player.x < 0) {

    player.x = 0;

  }


  player.grounded = false;


  // PLATFORM COLLISIONS

  for (const platform of platforms) {

    const wasAbove =

      player.y +
      player.height -
      player.vy

      <= platform.y;


    if (

      rectangleHit(player, platform) &&

      player.vy >= 0 &&

      wasAbove

    ) {

      player.y =
        platform.y -
        player.height;


      player.vy = 0;


      player.grounded = true;

    }

  }


  // SPIKES

  for (const spike of spikes) {

    if (
      rectangleHit(player, spike)
    ) {

      resetPlayer();

    }

  }


  // SPRINGS

  for (const spring of springs) {

    if (
      rectangleHit(player, spring)
    ) {

      player.vy = -22;

      player.y =
        spring.y -
        player.height;

    }

  }


  // POWERUPS

  for (const power of powerups) {

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


    if (
      Math.sqrt(
        dx * dx +
        dy * dy
      ) < 40
    ) {

      power.used = true;


      socket.emit(
        "slowOpponent",
        room
      );


      bigMessage.textContent =
        "SLOW ATTACK!";


      setTimeout(() => {

        bigMessage.textContent = "";

      }, 900);

    }

  }


  // FALL OFF LEVEL

  if (
    player.y >
    canvas.height + 300
  ) {

    resetPlayer();

  }


  // FINISH LINE

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


  // CAMERA

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


  // SEND POSITION TO OTHER PLAYER

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


function drawBackground() {

  ctx.fillStyle =
    "#18213b";


  ctx.fillRect(

    0,
    0,

    canvas.width,
    canvas.height

  );


  ctx.fillStyle =
    "#222e51";


  for (
    let x = 0;
    x < WORLD_WIDTH;
    x += 400
  ) {

    const screenX =
      x - cameraX * 0.25;


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


function draw() {

  drawBackground();


  ctx.save();


  ctx.translate(
    -cameraX,
    0
  );


  // PLATFORMS

  ctx.fillStyle =
    "#53688f";


  for (const p of platforms) {

    ctx.fillRect(
      p.x,
      p.y,
      p.w,
      p.h
    );


    ctx.fillStyle =
      "#72d572";


    ctx.fillRect(
      p.x,
      p.y,
      p.w,
      8
    );


    ctx.fillStyle =
      "#53688f";

  }


  // SPIKES

  ctx.fillStyle =
    "#ff4c5e";


  for (const s of spikes) {

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

        s.x + i * 20,

        s.y + s.h

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


  // SPRINGS

  for (const s of springs) {

    ctx.fillStyle =
      "#ffd43b";


    ctx.fillRect(
      s.x,
      s.y,
      s.w,
      s.h
    );


    ctx.fillStyle =
      "#ff8c32";


    ctx.fillRect(
      s.x,
      s.y,
      s.w,
      8
    );

  }


  // SLOW POWERUPS

  for (const p of powerups) {

    if (p.used) {
      continue;
    }


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


  // FINISH LINE

  ctx.fillStyle =
    "white";


  ctx.fillRect(

    WORLD_WIDTH - 120,

    250,

    12,

    350

  );


  // OTHER PLAYER

  ctx.fillStyle =
    "#ff5757";


  ctx.fillRect(

    opponent.x,
    opponent.y,

    opponent.width,
    opponent.height

  );


  // YOUR PLAYER

  ctx.fillStyle =
    "#49a7ff";


  ctx.fillRect(

    player.x,
    player.y,

    player.width,
    player.height

  );


  // PLAYER EYE

  ctx.fillStyle =
    "white";


  ctx.fillRect(

    player.x + 22,

    player.y + 10,

    7,

    7

  );


  ctx.restore();

}


function gameLoop() {

  update();

  draw();

  requestAnimationFrame(
    gameLoop
  );

}


gameLoop();