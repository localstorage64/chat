(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const size = 52;
  let x = window.innerWidth / 2 - size / 2;
  let y = window.innerHeight / 2 - size / 2;
  let targetX = x;
  let targetY = y;
  let touching = false;

  const followSpeed = 12;
  let lastTime = performance.now();

  function draw() {
    ctx.fillStyle = "#0d0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff0303";
    ctx.fillRect(x, y, size, size);

    if (touching) {
      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.arc(targetX + size / 2, targetY + size / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function update(dt) {
    const k = Math.min(1, followSpeed * dt);
    x += (targetX - x) * k;
    y += (targetY - y) * k;
  }

  function loop(t) {
    const dt = (t - lastTime) / 1000;
    lastTime = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function setTargetFromTouch(touch) {
    const rect = canvas.getBoundingClientRect();
    targetX = touch.clientX - rect.left - size / 2;
    targetY = touch.clientY - rect.top - size / 2;
  }

  canvas.addEventListener("touchstart", (e) => {
    touching = true;
    setTargetFromTouch(e.changedTouches[0]);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!touching) return;
    setTargetFromTouch(e.changedTouches[0]);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchend", () => { touching = false; });
  canvas.addEventListener("touchcancel", () => { touching = false; });

  requestAnimationFrame(loop);
})();