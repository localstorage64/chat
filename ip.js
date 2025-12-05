// IP'yi al ve listeye ekle
async function getUserIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    const ip = data.ip;

    // LocalStorage'da IP listesi tut
    let ipList = JSON.parse(localStorage.getItem("ip_list") || "[]");
    if (!ipList.includes(ip)) {
      ipList.push(ip);
      localStorage.setItem("ip_list", JSON.stringify(ipList));
    }

    showIps();
  } catch (err) {
    console.error("IP alınamadı:", err);
  }
}

// IP'leri listele
function showIps() {
  const ipList = JSON.parse(localStorage.getItem("ip_list") || "[]");
  const container = document.getElementById("ip-container");

  if (ipList.length === 0) {
    container.innerHTML = "<p>Henüz IP kaydı yok.</p>";
    return;
  }

  container.innerHTML = "<ul>" +
    ipList.map(ip => `<li>${ip}</li>`).join("") +
    "</ul>";
}

// Sayfa yüklenince çalıştır
window.onload = getUserIp;