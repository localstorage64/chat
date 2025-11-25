(function() {
    'use strict';

    let spamInterval = null;

    // === Panel ===
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.background = '#222';
    panel.style.color = '#fff';
    panel.style.padding = '10px';
    panel.style.zIndex = '9999';
    panel.style.fontSize = '12px';
    panel.style.width = '240px';
    panel.style.border = '1px solid #555';
    panel.innerHTML = `
        <b>Pixel Spammer v3.9</b><br>
        <button id="kaktus_startrek">Başlat</button>
        <button id="penguen_stoplama">Durdur</button>
        <hr>
        <div id="dinozor_loglama" style="max-height:120px;overflow:auto;background:#871313;padding:5px;"></div>
    `;
    document.body.appendChild(panel);

    function log(msg, type="info") {
        const logDiv = document.getElementById('dinozor_loglama');
        const time = new Date().toLocaleTimeString();
        const color = type === "error" ? "red" : "white";
        logDiv.innerHTML += `<span style="color:${color}">[${time}] ${msg}</span><br>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function spamPixel() {
        const MAX = 10000;
        let x = Math.floor(Math.random() * (2 * MAX + 1)) - MAX;
        let y = Math.floor(Math.random() * (2 * MAX + 1)) - MAX;
        const zoom = 33;
        const hash = `#d,${x},${y},${zoom}`;
        log(`Pixel koyuldu <a href="${hash}" target="_blank">${hash}</a>`);
    }

    document.getElementById('kaktus_startrek').onclick = () => {
        if (!spamInterval) {
            spamInterval = setInterval(spamPixel, 1000);
            log("Spammer başlatıldı");
        }
    };

    document.getElementById('penguen_stoplama').onclick = () => {
        if (spamInterval) {
            clearInterval(spamInterval);
            spamInterval = null;
            log("Spammer durduruldu");
        }
    };
})();