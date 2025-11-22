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
  let vx = 0, vy = 0; // hız vektörü

  const friction = 0.98; // sürtünme
  const accel = 0.5;     // sensör hassasiyet

  function draw() {
    ctx.fillStyle = "blue"; // arka plan
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red"; // kare
    ctx.fillRect(x, y, size, size);
  }

  function update() {
    // hız uygula
    x += vx;
    y += vy;

    // sürtünme
    vx *= friction;
    vy *= friction;

    // sınırlar
    if (x < 0) { x = 0; vx = -vx * 0.5; }
    if (y < 0) { y = 0; vy = -vy * 0.5; }
    if (x > window.innerWidth - size) { x = window.innerWidth - size; vx = -vx * 0.5; }
    if (y > window.innerHeight - size) { y = window.innerHeight - size; vy = -vy * 0.5; }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Telefon sensörleri
  window.addEventListener("deviceorientation", (e) => {
    // gamma: sağ-sol eğim, beta: öne-arkaya eğim
    vx += e.gamma * accel * 0.01;
    vy += e.beta * accel * 0.01;
  });

  // Mouse test (PC için): kareyi hızla itmek
  canvas.addEventListener("mousemove", (e) => {
    if (e.buttons) {
      vx += (e.movementX) * 0.2;
      vy += (e.movementY) * 0.2;
    }
  });

  loop();
})();