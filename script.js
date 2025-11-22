(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const particles = [];
  const count = 30000;
  const size = 3; // kare boyutu

  // Çakışma kontrolü ile kareleri yerleştir
  function isOverlapping(x, y) {
    for (const p of particles) {
      if (Math.abs(p.x - x) < size && Math.abs(p.y - y) < size) {
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < count; i++) {
    let x, y;
    let tries = 0;
    do {
      x = Math.random() * (window.innerWidth - size);
      y = Math.random() * (window.innerHeight - size);
      tries++;
    } while (isOverlapping(x, y) && tries < 50);

    particles.push({ x, y, vx: 0, vy: 0 });
  }

  const friction = 0.98;
  const accel = 0.5;

  function draw() {
    ctx.fillStyle = "#1e90ff"; // deniz rengi
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d2b48c"; // kum rengi
    for (const p of particles) {
      ctx.fillRect(p.x, p.y, size, size);
    }
  }

  function update() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      p.vx *= friction;
      p.vy *= friction;

      // sınırlar
      if (p.x < 0) { p.x = 0; p.vx = -p.vx * 0.5; }
      if (p.y < 0) { p.y = 0; p.vy = -p.vy * 0.5; }
      if (p.x > window.innerWidth - size) { p.x = window.innerWidth - size; p.vx = -p.vx * 0.5; }
      if (p.y > window.innerHeight - size) { p.y = window.innerHeight - size; p.vy = -p.vy * 0.5; }
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Telefon sensörleri
  window.addEventListener("deviceorientation", (e) => {
    const ax = e.gamma * accel * 0.01;
    const ay = e.beta * accel * 0.01;
    for (const p of particles) {
      p.vx += ax;
      p.vy += ay;
    }
  });

  // Mouse test
  canvas.addEventListener("mousemove", (e) => {
    if (e.buttons) {
      for (const p of particles) {
        p.vx += e.movementX * 0.02;
        p.vy += e.movementY * 0.02;
      }
    }
  });

  loop();
})();