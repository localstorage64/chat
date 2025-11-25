(function() {
    'use strict';

    let spamInterval = null;
    let offsetX = 0, offsetY = 0, isDragging = false;

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
    panel.style.cursor = 'grab';
    panel.innerHTML = `
        <b>Pixel Spammer v3.9</b><br>
        <button id="kaktus_startrek">Başlat</button>
        <button id="penguen_stoplama">Durdur</button>
        <hr>
        <div id="dinozor_loglama" style="max-height:120px;overflow:auto;background:#871313;padding:5px;"></div>
    `;
    document.body.appendChild(panel);

    // === Touch sürükleme ===
    panel.addEventListener('touchstart', e => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - panel.offsetLeft;
        offsetY = touch.clientY - panel.offsetTop;
    });

    document.addEventListener('touchmove', e => {
        if (isDragging) {
            const touch = e.touches[0];
            panel.style.left = (touch.clientX - offsetX) + 'px';
            panel.style.top = (touch.clientY - offsetY) + 'px';
            panel.style.right = 'auto'; // sağ sabitlemeyi kaldır
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    function log(msg, type="info") {
        const logDiv = document.getElementById('dinozor_loglama');
        const time = new Date().toLocaleTimeString();
        const color = type === "error" ? "red" : "white";
        logDiv.innerHTML += `<span style="color:${color}">[${time}] ${msg}</span><br>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function wrapCoord(value, max) {
        if (value > max) return value - (2 * max + 1);
        if (value < -max) return value + (2 * max + 1);
        return value;
    }

    function placePixel(x, y) {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            log("Canvas bulunamadı", "error");
            return false;
        }
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const eventInit = {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            button: 0
        };
        canvas.dispatchEvent(new MouseEvent('mousedown', eventInit));
        canvas.dispatchEvent(new MouseEvent('mouseup', eventInit));
        return true;
    }

    function spamPixel() {
        const MAX = 10000;
        let x = Math.floor(Math.random() * (2 * MAX + 1)) - MAX;
        let y = Math.floor(Math.random() * (2 * MAX + 1)) - MAX;
        x = wrapCoord(x, MAX);
        y = wrapCoord(y, MAX);
        const zoom = 33;
        const hash = `#d,${x},${y},${zoom}`;
        window.location.hash = hash;
        if (placePixel(x, y)) {
            log(`Pixel koyuldu <a href="${hash}" target="_blank">${hash}</a>`);
        } else {
            log("Pixel koyulamadı", "error");
        }
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