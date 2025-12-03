//kaynak kodunu napacan?
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
  remove,
  query,
  orderByChild,
  limitToLast,
  onChildAdded,
  onChildRemoved
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// DOM
const userInfo = document.getElementById("user-info");
const authSection = document.getElementById("auth");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const authMsg = document.getElementById("auth-msg");
const authToggle = document.getElementById("auth-toggle");
const authSubmit = document.getElementById("auth-submit");

const chatSection = document.getElementById("chat");
const messagesEl = document.getElementById("messages");
const msgForm = document.getElementById("msg-form");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send");
const logoutBtn = document.getElementById("logout");

const adminPanel = document.getElementById("admin");
const adminHandle = document.getElementById("admin-handle");
//admin js ekledim admin kısımı işlevsiz.

let anonUser = null;
let current = null; // isim
let mode = "login"; // ya da sifre
const ADMIN_NAME = "admin";

//bazı önemsiz araçlar
function showMsg(text, err = true){
  authMsg.style.color = err ? "#b91c1c" : "#065f46";
  authMsg.textContent = text || "";
}
function sanitize(u){ return (u||"").trim().toLowerCase(); }
function validUsername(u) {
  return /^[a-zA-Z0-9_\-\!\@\#\$\%\^\&\*\(\)\+\=\{\}\[\]\:\;\"\'\<\>\,\.\?\/\\|]{3,30}$/.test(u);
}
function formatTime(ts){ return new Date(ts||Date.now()).toLocaleString(); }



// Sifre güvenliği SHA-256 ile sifre hashleme
async function hashPw(pw){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// database icin yardımcı kısım
async function getUser(name){
  const uname = sanitize(name);
  if (!uname) return null;
  const snap = await get(child(ref(db), `users/${uname}`));
  return snap.exists() ? snap.val() : null;
}

async function createUser(name, pw){
  const uname = sanitize(name);
  
  const existing = await getUser(uname);
  if (existing) throw new Error("Kullanıcı zaten var");
  const hash = await hashPw(pw);
  const rec = { passwordHash: hash, createdAt: Date.now(), banned: false };
  await set(ref(db, `users/${uname}`), rec);
  return { username: uname };
}

async function signInUser(name, pw){
  const uname = sanitize(name);
  const rec = await getUser(uname);
  if (!rec) throw new Error("Kullanıcı bulunamadı");
  if (rec.banned) throw new Error("Kullanıcı yasaklı");
  const hash = await hashPw(pw);
  if (hash !== rec.passwordHash) throw new Error("Parola yanlış");
  return { username: uname };
}

//İnanBendeBilmiyorum
function showChat(show){
  authSection.hidden = show;
  chatSection.hidden = !show;
  if (!show){
    adminPanel.hidden = true;
    messagesEl.innerHTML = "";
  }
}

// giris yapma yerinden kayıt olma yerine geçis
authToggle.addEventListener("click", ()=>{
  mode = (mode === "login") ? "signup" : "login";
  authTitle.textContent = mode === "login" ? "Giriş Yap" : "Hesap Oluştur";
  authSubmit.textContent = mode === "login" ? "Giriş Yap" : "Hesap Oluştur";
  showMsg("");
  showChat(false);
});

// uid
signInAnonymously(auth).catch(e=>{
  console.warn("Anon sign-in:", e);
});
onAuthStateChanged(auth, u=>{
  anonUser = u;
  userInfo.textContent = u ? `Bağlı (uid: ${u.uid.slice(0,6)})` : "Sunucu Aktif";
});

// giris formuuuuuyy
authForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  showMsg("");
  const name = usernameInput.value;
  const pw = passwordInput.value;
  if (!name || !pw) { showMsg("Kullanıcı adı ve parola gerekli"); return; }

  try {
    if (mode === "signup"){
      document.getElementById("auth-toggle").textContent = "Hesabım var";
      await createUser(name, pw);
      current = { username: sanitize(name) };
      showMsg("Hesap oluşturuldu", false);
    } else {
      const u = await signInUser(name, pw);
      current = u;
      showMsg("Giriş başarılı", false);
    }

    // aç bi falım rahatla👍
    showChat(true);
    if (current.username === ADMIN_NAME) adminPanel.hidden = false;
    loadMessages();
    loadAdminListsIfNeeded();
  } catch (err) {
    showMsg(err.message || "Hata oluştu");
  }
});

// cıkıs yapma
logoutBtn.addEventListener("click", ()=>{
  current = null;
  showChat(false);
  usernameInput.value = "";
  passwordInput.value = "";
  showMsg("");
});

// mesaj gonderme
msgForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if (!current) return;
  const text = msgInput.value.trim();
  if (!text) return;
  // check ban before sending
  const rec = await getUser(current.username);
  if (rec && rec.banned){ alert("Yasaklısınız"); return; }

  const r = ref(db, "messages");
  const p = push(r);
  await set(p, { username: current.username, uid: anonUser ? anonUser.uid : null, text, createdAt: Date.now() });
  msgInput.value = "";
});

// firebasedeki kayıtlı mesajları cekme
function loadMessages(){
  messagesEl.innerHTML = "";
  const q = query(ref(db, "messages"), orderByChild("createdAt"), limitToLast(200));
  onChildAdded(q, snap=>{
    const v = snap.val();
    const key = snap.key;
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid #f0f0f0";
    div.innerHTML = `<div style="font-size:13px;color:#666">${v.username || v.uid} • ${formatTime(v.createdAt)}</div><div style="margin-top:6px">${escapeHtml(v.text)}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
  onChildRemoved(ref(db, "messages"), snap=>{
    // ve loadmessages
    loadMessages();
  });
}

function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// admin kısımı
async function loadAdminListsIfNeeded(){
  if (!current || current.username !== ADMIN_NAME) return;
  adminMessages.innerHTML = "";
  adminUsers.innerHTML = "";

  // messages
  const msgsSnap = await get(query(ref(db, "messages"), orderByChild("createdAt"), limitToLast(200)));
  if (msgsSnap.exists()){
    const msgs = msgsSnap.val();
    const keys = Object.keys(msgs).sort((a,b)=> (msgs[a].createdAt||0)-(msgs[b].createdAt||0));
    keys.forEach(k=>{
      const m = msgs[k];
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.border = "1px solid #eee";
      item.style.padding = "6px";
      item.style.borderRadius = "6px";
      item.innerHTML = `<div style="font-size:13px;color:#333">${m.username} • ${new Date(m.createdAt).toLocaleString()}<div style="font-size:14px;margin-top:6px">${escapeHtml(m.text)}</div></div>`;
      const controls = document.createElement("div");
      const del = document.createElement("button");
      del.textContent = "Sil";
      del.addEventListener("click", async ()=>{
        if (!confirm("Silmek istiyor musunuz?")) return;
        await remove(ref(db, `messages/${k}`));
        loadAdminListsIfNeeded();
      });
      const ban = document.createElement("button");
      ban.textContent = "Yasakla";
      ban.addEventListener("click", async ()=>{
        if (!m.username) return alert("Kullanıcı yok");
        if (!confirm(`${m.username} yasaklansın mı?`)) return;
        await set(ref(db, `users/${m.username}/banned`), true);
        loadAdminListsIfNeeded();
      });
      controls.appendChild(ban);
      controls.appendChild(del);
      item.appendChild(controls);
      adminMessages.appendChild(item);
    });
  }

  // kulanıcılar [onemli]
  const usersSnap = await get(ref(db, "users"));
  if (usersSnap.exists()){
    const users = usersSnap.val();
    Object.keys(users).sort().forEach(u=>{
      const rec = users[u];
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.border = "1px solid #eee";
      item.style.padding = "6px";
      item.style.borderRadius = "6px";
      item.innerHTML = `<div><strong>${u}</strong><div style="font-size:12px;color:#666">Oluşturma: ${new Date(rec.createdAt||0).toLocaleString()}</div></div>`;
      const controls = document.createElement("div");
      const toggle = document.createElement("button");
      toggle.textContent = rec.banned ? "Kaldır" : "Yasakla";
      toggle.addEventListener("click", async ()=>{
        await set(ref(db, `users/${u}/banned`), !rec.banned);
        loadAdminListsIfNeeded();
      });
      const del = document.createElement("button");
      del.textContent = "Hesap Sil";
      del.addEventListener("click", async ()=>{
        if (!confirm("Hesabı silmek istediğinize emin misiniz?")) return;
        await remove(ref(db, `users/${u}`));
        loadAdminListsIfNeeded();
      });
      controls.appendChild(toggle);
      controls.appendChild(del);
      item.appendChild(controls);
      adminUsers.appendChild(item);
    });
  }
}

// Tum mesajları silme butonu
adminClear.addEventListener("click", async ()=>{
  if (!confirm("Tüm mesajlar silinsin mi?")) return;
  await remove(ref(db, "messages"));
  loadAdminListsIfNeeded();
});

// buda suan calısmıyor
banBtn.addEventListener("click", async ()=>{
  const u = sanitize(banName.value);
  if (!validUsername(u)) return alert("Geçersiz kullanıcı");
  await set(ref(db, `users/${u}/banned`), true);
  loadAdminListsIfNeeded();
});
unbanBtn.addEventListener("click", async ()=>{
  const u = sanitize(banName.value);
  if (!validUsername(u)) return alert("Geçersiz kullanıcı");
  await set(ref(db, `users/${u}/banned`), false);
  loadAdminListsIfNeeded();
});

// panel kapatma [suan calısmıyor]
adminClose.addEventListener("click", ()=> adminPanel.hidden = true);

// suruklenebilir panel denemesi
(function(){
  let dragging = false, startX=0, startY=0, startLeft=0, startTop=0;
  adminHandle.addEventListener("mousedown", (e)=>{
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = adminPanel.getBoundingClientRect();
    startLeft = rect.left; startTop = rect.top;
    adminHandle.style.cursor = "grabbing";
    document.addEventListener("mousemove", onmove);
    document.addEventListener("mouseup", onup);
  });
  function onmove(e){
    if (!dragging) return;
    adminPanel.style.left = (startLeft + (e.clientX - startX)) + "px";
    adminPanel.style.top = (startTop + (e.clientY - startY)) + "px";
    adminPanel.style.position = "fixed";
  }
  function onup(){
    dragging = false;
    adminHandle.style.cursor = "grab";
    document.removeEventListener("mousemove", onmove);
    document.removeEventListener("mouseup", onup);
  }
})();

// 🙂👍
onChildAdded(query(ref(db, "messages"), orderByChild("createdAt"), limitToLast(1)), ()=> {
  if (current && current.username === ADMIN_NAME) loadAdminListsIfNeeded();
});

// Ve son...
showChat(false);