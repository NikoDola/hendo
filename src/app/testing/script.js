const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

let x = 100;
let y = 100;
const size = 50;
const speed = 5;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, size, size);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") x -= speed;
  if (e.key === "ArrowRight") x += speed;
  if (e.key === "ArrowUp") y -= speed;
  if (e.key === "ArrowDown") y += speed;
});

function update() {
  draw();
  requestAnimationFrame(update);
}



update();