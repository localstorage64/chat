// admin-panel-enhance

(async function(){
  // --- HELPERS ---
  function log(...args){ console.log('[admin-enhance]', ...args); }
  function err(...args){ console.error('[admin-enhance]', ...args); }

  // DB URL tespiti
  function detectDbUrl(){
    try {
      if (window.firebase && firebase.apps && firebase.apps[0] && firebase.apps[0].options && firebase.apps[0].options.databaseURL) {
        return firebase.apps[0].options.databaseURL.replace(/\/$/,'');
      }
      if (window.firebaseConfig && firebaseConfig.databaseURL) return firebaseConfig.databaseURL.replace(/\/$/,'');
    } catch(e){}
    // fallback (uygun değilse burayı projenize göre değiştirin)
    return 'https://localstorage-f4705-default-rtdb.firebaseio.com';
  }

  // token alma (varsa)
  async function getTokenIfAvailable(){
    try {
      if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        return await firebase.auth().currentUser.getIdToken();
      }
      if (window.auth && auth.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        return await auth.currentUser.getIdToken();
      }
    } catch(e){ log('token fetch failed', e); }
    return null;
  }

  const DB_URL = detectDbUrl();
  log('Using DB URL:', DB_URL);
  const token = await getTokenIfAvailable();
  if (token) log('Got auth token, will use for DB requests');

  function q(path){
    const base = DB_URL.replace(/\/$/,'');
    const encoded = encodeURIComponent(path).replace(/%2F/g, '/'); // keep slashes readable
    // we will construct url manually to avoid double-encoding keys
    return `${base}/${path}.json${token ? '?auth=' + encodeURIComponent(token) : ''}`;
  }

  async function fetchJson(url, opts){
    const r = await fetch(url, opts);
    if (!r.ok) {
      const txt = await r.text().catch(()=>null);
      throw new Error(txt || `${r.status} ${r.statusText}`);
    }
    return r.json();
  }

  // --- DOM hazırlığı ---
  let admin = document.getElementById('admin');
  if (!admin){
    admin = document.createElement('div');
    admin.id = 'admin';
    // hafif stil, index.html'deki konuma ekle (sağa alt köşe gibi)
    admin.style.position = 'fixed';
    admin.style.right = '12px';
    admin.style.bottom = '12px';
    admin.style.width = '340px';
    admin.style.maxHeight = '60vh';
    admin.style.overflow = 'auto';
    admin.style.background = '#fff';
    admin.style.border = '1px solid #ddd';
    admin.style.padding = '8px';
    admin.style.borderRadius = '8px';
    admin.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
    document.body.appendChild(admin);
  }
  admin.innerHTML = ''; // temizle

  const header = document.createElement('div');
  header.id = 'admin-handle';
  header.style.fontWeight = '700';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '6px';
  header.innerHTML = `<div>Admin Panel🦗</div>`;
  admin.appendChild(header);

  const ctrlBar = document.createElement('div');
  ctrlBar.style.display = 'flex';
  ctrlBar.style.gap = '6px';
  ctrlBar.style.marginBottom = '8px';
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Yenile';
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Tüm Mesajları Sil';
  clearAllBtn.style.background = '#ffdcdc';
  ctrlBar.appendChild(refreshBtn);
  ctrlBar.appendChild(clearAllBtn);
  admin.appendChild(ctrlBar);

  const usersEl = document.createElement('div');
  usersEl.id = 'admin-users';
  usersEl.innerHTML = '<h4 style="margin:6px 0 4px 0">Kullanıcılar</h4>';
  admin.appendChild(usersEl);

  const msgsEl = document.createElement('div');
  msgsEl.id = 'admin-messages';
  admin.appendChild(msgsEl);

  // buton oluşturucu
  function makeBtn(text, opts = {}){
    const b = document.createElement('button');
    b.textContent = text;
    b.style.marginLeft = '6px';
    b.style.padding = '6px 8px';
    b.style.borderRadius = '6px';
    b.style.border = '1px solid #ccc';
    b.style.background = opts.background || '#fff';
    b.style.cursor = 'pointer';
    return b;
  }

  // --- Veri yükleme / işlemler ---
  async function loadUsers(){
    usersEl.querySelectorAll('.user-item')?.forEach(n=>n.remove());
    try {
      const data = await fetchJson(q('users'));
      if (!data || Object.keys(data).length === 0){
        const note = document.createElement('div'); note.className='user-item'; note.textContent='Kullanıcı yok'; usersEl.appendChild(note); return;
      }
      const keys = Object.keys(data).sort();
      for (const k of keys){
        const rec = data[k] || {};
        const item = document.createElement('div');
        item.className = 'user-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.border = '1px solid #eee';
        item.style.padding = '6px';
        item.style.borderRadius = '6px';
        item.style.marginTop = '6px';

        const left = document.createElement('div');
        left.innerHTML = `<strong>${k}</strong> ${rec.createdAt ? ('• ' + new Date(rec.createdAt).toLocaleString()) : ''} ${rec.banned?'<span style="color:#b91c1c;margin-left:6px">(yasaklı)</span>':''}`;

        const controls = document.createElement('div');
        const banBtn = makeBtn(rec.banned ? 'Kaldır' : 'Yasakla', { background: rec.banned ? '#f0f0f0' : '#ffdddd' });
        banBtn.onclick = async ()=>{
          if (!confirm(`${k} için işlem onaylıyor musunuz?`)) return;
          try {
            await fetchJson(q(`users/${encodeURIComponent(k)}/banned`), { method: 'PUT', body: JSON.stringify(!rec.banned) });
            alert('İşlem başarılı');
            await loadUsers();
          } catch(e){ alert('Hata: ' + (e.message || e)); err(e); }
        };

        const delBtn = makeBtn('Hesap Sil', { background: '#ffd8d8' });
        delBtn.onclick = async ()=>{
          if (!confirm(`${k} hesabını kalıcı silmek istiyor musunuz?`)) return;
          try {
            await fetch(`${DB_URL}/users/${encodeURIComponent(k)}.json${token ? '?auth=' + encodeURIComponent(token) : ''}`, { method: 'DELETE' });
            alert('Hesap silindi');
            await loadUsers();
          } catch(e){ alert('Hata: ' + (e.message || e)); err(e); }
        };

        controls.appendChild(banBtn);
        controls.appendChild(delBtn);
        item.appendChild(left);
        item.appendChild(controls);
        usersEl.appendChild(item);
      }
    } catch(e){
      const er = document.createElement('div');
      er.style.color = '#b91c1c';
      er.className = 'user-item';
      er.textContent = 'users yüklenirken hata: ' + (e.message || e);
      usersEl.appendChild(er);
      err(e);
    }
  }

  async function loadMessages(){
    msgsEl.querySelectorAll('.msg-item')?.forEach(n=>n.remove());
    try {
      // orderBy paramını url içinde doğru encode et
      const data = await fetchJson(`${DB_URL}/messages.json${token ? '?auth=' + encodeURIComponent(token) : ''}&orderBy=%22createdAt%22&limitToLast=200`);
      if (!data || Object.keys(data).length === 0){
        const note = document.createElement('div'); note.className='msg-item'; note.textContent='Mesaj yok'; msgsEl.appendChild(note); return;
      }
      const entries = Object.entries(data).sort((a,b)=> (a[1].createdAt||0)-(b[1].createdAt||0));
      for (const [key, msg] of entries){
        const item = document.createElement('div');
        item.className = 'msg-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.border = '1px solid #eee';
        item.style.padding = '6px';
        item.style.borderRadius = '6px';
        item.style.marginTop = '6px';

        const left = document.createElement('div');
        left.innerHTML = `<div style="font-size:13px;color:#333">${msg.username || msg.uid} • ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div><div style="margin-top:6px">${String(msg.text || '').slice(0,300)}</div>`;

        const controls = document.createElement('div');
        const del = makeBtn('Mesaj Sil', { background: '#ffd8d8' });
        del.onclick = async ()=>{
          if (!confirm('Bu mesajı silmek istiyor musunuz?')) return;
          try {
            await fetch(`${DB_URL}/messages/${encodeURIComponent(key)}.json${token ? '?auth=' + encodeURIComponent(token) : ''}`, { method: 'DELETE' });
            alert('Mesaj silindi');
            await loadMessages();
          } catch(e){ alert('Hata: ' + (e.message || e)); err(e); }
        };
        controls.appendChild(del);
        item.appendChild(left);
        item.appendChild(controls);
        msgsEl.appendChild(item);
      }
    } catch(e){
      const er = document.createElement('div');
      er.style.color = '#b91c1c';
      er.className = 'msg-item';
      msgsEl.appendChild(er);
      err(e);
    }
  }

  // clear all messages (dangerous)
  async function clearAllMessages(){
    if (!confirm('Tüm mesajları silmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`${DB_URL}/messages.json${token ? '?auth=' + encodeURIComponent(token) : ''}`, { method: 'DELETE' });
      alert('Tüm mesajlar silindi');
      await loadMessages();
    } catch(e){ alert('Hata: ' + (e.message || e)); err(e); }
  }

  // attach ctrl events
  refreshBtn.addEventListener('click', ()=>{ loadUsers(); loadMessages(); });
  clearAllBtn.addEventListener('click', clearAllMessages);

  // initial load
  await loadUsers();
  await loadMessages();

  // expose refresh externally
  window.adminEnhance = window.adminEnhance || {};
  window.adminEnhance.refresh = async ()=>{ await loadUsers(); await loadMessages(); };
  log('admin-enhance loaded. Use window.adminEnhance.refresh() to reload lists.');

})();