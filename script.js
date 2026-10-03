const firebaseConfig = {
  apiKey: "AIzaSyBU0JDv7E1d4NQH719-SHKYe2rxftMmNYY",
  authDomain: "redkarbpn-ef14a.firebaseapp.com",
  projectId: "redkarbpn-ef14a",
  storageBucket: "redkarbpn-ef14a.firebasestorage.app",
  messagingSenderId: "287638634576",
  appId: "1:287638634576:web:c36aa9ef84de9c68015155",
  measurementId: "G-V8H94L4N16"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Akun operator default — otomatis terbaca di Firestore =====
// Ganti email ini kalau mau ganti operator. Perbandingan case-insensitive.
const DEFAULT_OPERATOR_EMAIL = 'redkarbalikpapan@gmail.com';

function isDefaultOperatorEmail(email) {
  return !!email && email.trim().toLowerCase() === DEFAULT_OPERATOR_EMAIL.toLowerCase();
}

function isOperatorUser(user, firestoreData) {
  if (!user) return false;
  if (isDefaultOperatorEmail(user.email)) return true;
  return !!(firestoreData && firestoreData.isOperator);
}

// Pastikan dokumen Firestore untuk operator default selalu ada & bertanda isOperator:true
// sehingga "terbaca otomatis" di database walau belum pernah dibuat manual.
function ensureOperatorDoc(user) {
  if (!user || !isDefaultOperatorEmail(user.email)) return Promise.resolve(false);
  const waktu = new Date().toLocaleString('id-ID');
  return db.collection('users').doc(user.uid).set({
    email: user.email,
    status: 'terverifikasi',
    waktu: waktu,
    isOperator: true,
    isDefaultOperator: true
  }, { merge: true }).then(() => true).catch(() => true);
}

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.setAttribute('aria-label', 'Buka menu navigasi');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function togglePassword(fieldId, btn) {
  const SVG_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const SVG_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.6 10.6 0 0 1 12 19c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.06-4.94M9.9 4.24A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.16 3.19M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
  const field = document.getElementById(fieldId);
  if (!field) return;
  const show = field.type === 'password';
  field.type = show ? 'text' : 'password';
  if (btn) {
    btn.innerHTML = show ? SVG_EYE_OFF : SVG_EYE;
    btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  }
}

function updateNav() {
  if (!navLinks) return;
  const path = window.location.pathname.split('/').pop() || 'index.html';

  auth.onAuthStateChanged(user => {
    const render = (isOperator) => {
      const isUser = !!user && !isOperator;

      const items = [
        { href: 'index.html', label: 'Beranda' },
        { href: 'about.html', label: 'About Us' }
      ];

      if (isOperator) {
        items.push({ href: 'verifikasi-anggota.html', label: 'Verifikasi Anggota' });
        items.push({ href: '#', label: 'Keluar', logout: 'true' });
      } else if (isUser) {
        items.push({ href: 'dashboard.html', label: 'Dashboard' });
        items.push({ href: '#', label: 'Keluar', logout: 'true' });
      } else {
        items.push({ href: 'login.html', label: 'Masuk' });
        items.push({ href: 'daftar.html', label: 'Daftar' });
      }

      navLinks.innerHTML = items.map(it => {
        if (it.logout) return `<li><a href="#" id="logoutNav" class="nav-logout">Keluar</a></li>`;
        const active = it.href === path ? ' class="active"' : '';
        return `<li><a href="${it.href}"${active}>${it.label}</a></li>`;
      }).join('');

      const logoutNav = document.getElementById('logoutNav');
      if (logoutNav) {
        logoutNav.addEventListener('click', function (e) {
          e.preventDefault();
          auth.signOut();
          window.location.href = 'index.html';
        });
      }

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
      });
    };

    if (!user) {
      render(false);
      return;
    }
    // Operator default langsung dikenali tanpa perlu cek Firestore dulu,
    // sekaligus pastikan dokumennya ada di database.
    if (isDefaultOperatorEmail(user.email)) {
      ensureOperatorDoc(user).finally(() => render(true));
      return;
    }
    db.collection('users').doc(user.uid).get()
      .then(doc => render(isOperatorUser(user, doc.exists ? doc.data() : null)))
      .catch(() => render(false));
  });
}

document.addEventListener('DOMContentLoaded', updateNav);

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (email && password) {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        const user = auth.currentUser;
        // Operator default: pastikan dokumennya ada lalu arahkan ke halaman operator
        if (isDefaultOperatorEmail(user.email)) {
          ensureOperatorDoc(user).finally(() => {
            window.location.href = 'verifikasi-anggota.html';
          });
          return;
        }
        db.collection('users').doc(user.uid).get()
          .then(doc => {
            if (doc.exists) {
              const data = doc.data();
              if (data.isOperator) {
                window.location.href = 'verifikasi-anggota.html';
              } else if (data.status === 'nonaktif') {
                alert('Akun Anda telah dinonaktifkan oleh operator.');
                auth.signOut();
              } else {
                window.location.href = 'dashboard.html';
              }
            } else {
              // Dokumen Firestore tidak ada (mis. sudah dihapus operator):
              // keluarkan sesi agar tidak mental login<->dashboard.
              // Catatan: akun Auth-nya masih ada — hapus manual di
              // Firebase Console > Authentication > Users bila perlu.
              alert('Data akun tidak ditemukan (mungkin telah dihapus operator).');
              auth.signOut().finally(() => {
                window.location.href = 'login.html';
              });
            }
          })
.catch(() => {
             if (window.showToast) window.showToast('Gagal memuat data akun. Coba muat ulang halaman.', 'error');
             window.location.href = 'dashboard.html';
           });
      })
      .catch(err => {
        alert('Gagal masuk: ' + err.message);
      });
    return false;
  }
  return false;
}

function getResetErrorMessage(err) {
  const code = (err && err.code) || '';
  if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
    return 'Email tidak terdaftar. Pastikan email yang dimasukkan benar dan sudah pernah didaftar.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.';
  }
  if (code === 'auth/missing-email' || code === 'auth/invalid-recipient-email') {
    return 'Masukkan email yang valid terlebih dahulu.';
  }
  return 'Gagal kirim email reset: ' + (err && err.message ? err.message : err);
}

function handleForgotPassword(e) {
  if (e) e.preventDefault();
  // Khusus operator — user biasa tidak punya link lupa password.
  // Reset untuk anggota dilakukan operator dari halaman verifikasi.
  const emailField = document.getElementById('operatorEmail');
  let email = emailField ? emailField.value.trim() : '';
  if (!email) {
    email = (window.prompt('Masukkan email akun Anda untuk reset password:') || '').trim();
  } else if (!window.confirm(`Kirim email reset password ke ${email}?`)) {
    return false;
  }
  if (!email) return false;
  const link = document.getElementById('operatorForgotLink');
  if (link) link.style.pointerEvents = 'none';
  auth.sendPasswordResetEmail(email)
.then(() => {
       const msg = `Email reset terkirim ke ${email}. Cek Inbox & folder Spam/Promosi, lalu klik link di email tersebut.`;
       if (window.showToast) window.showToast(msg, 'success');
     })
     .catch(err => {
       const msg = getResetErrorMessage(err);
       console.error('Reset password gagal:', err);
       if (window.showToast) window.showToast(msg, 'error');
     })
    .finally(() => {
      if (link) link.style.pointerEvents = '';
    });
  return false;
}

// Otomatis pasang listener link "Lupa password?" khusus operator
document.addEventListener('DOMContentLoaded', function () {
  const opLink = document.getElementById('operatorForgotLink');
  if (opLink) opLink.addEventListener('click', handleForgotPassword);
});

function handleDaftar(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const telepon = document.getElementById('telepon').value;
  // Cegah email operator default didaftarkan sebagai anggota biasa
  if (isDefaultOperatorEmail(email)) {
    alert('Email ini adalah akun operator. Silakan masuk lewat halaman Operator.');
    window.location.href = 'operator-login.html';
    return false;
  }
  if (email && password && telepon) {
  const waktu = new Date().toLocaleString('id-ID');
    auth.createUserWithEmailAndPassword(email, password)
      .then(result => {
        return db.collection('users').doc(result.user.uid).set({
          email: email,
          telepon: telepon,
          status: 'menunggu',
          waktu: waktu,
          isOperator: false
        });
      })
      .then(() => {
        alert('Akun berhasil dibuat! Mengalihkan ke dashboard...');
        window.location.href = 'dashboard.html';
      })
      .catch(err => {
        if (err.code === 'auth/email-already-in-use') {
          alert('Akun sudah terdaftar!');
        } else {
          alert('Gagal mendaftar: ' + err.message);
        }
      });
    return false;
  }
  return false;
}

function loginOperator(e) {
  e.preventDefault();
  const email = document.getElementById('operatorEmail').value.trim();
  const password = document.getElementById('operatorPassword').value;

  if (email && password) {
    // Hanya email operator default yang boleh lewat form ini
    if (!isDefaultOperatorEmail(email)) {
      alert('Email ini bukan akun operator.\nOperator default: ' + DEFAULT_OPERATOR_EMAIL);
      return false;
    }
    auth.signInWithEmailAndPassword(email, password)
      .then(result => {
        // Otomatis buat/perbarui dokumen operator di Firestore,
        // jadi walau belum ada di database langsung terbaca sebagai operator.
        return ensureOperatorDoc(result.user);
      })
      .then(() => {
        alert('Login operator berhasil!');
        window.location.href = 'verifikasi-anggota.html';
      })
      .catch(err => {
        if (err && err.code && err.code.startsWith('auth/')) {
          alert('Username atau password operator salah! Pastikan akun ' + DEFAULT_OPERATOR_EMAIL + ' sudah dibuat di Firebase Authentication.');
        } else {
          alert('Gagal login operator: ' + (err && err.message ? err.message : err));
          auth.signOut();
        }
      });
  }
  return false;
}

// Otomatis sambungkan form operator (sebelumnya form tidak punya listener sehingga tombol Login tidak bereaksi)
document.addEventListener('DOMContentLoaded', function () {
  const opForm = document.getElementById('operatorLoginForm');
  if (opForm) {
    opForm.addEventListener('submit', loginOperator);
    // Isi otomatis email default biar operator tinggal isi password
    const emailField = document.getElementById('operatorEmail');
    if (emailField && !emailField.value) emailField.value = DEFAULT_OPERATOR_EMAIL;
  }
});

function cekOperatorLogin() {
  if (!window.location.pathname.includes('verifikasi-anggota')) return;
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'operator-login.html';
    } else if (isDefaultOperatorEmail(user.email)) {
      // Operator default selalu lolos, sambil pastikan dokumennya ada
      ensureOperatorDoc(user);
    } else {
      db.collection('users').doc(user.uid).get()
        .then(doc => {
          if (!doc.exists || !doc.data().isOperator) {
            alert('Akun ini bukan akun operator.');
            auth.signOut();
            window.location.href = 'operator-login.html';
          }
        });
    }
  });
}

document.addEventListener('DOMContentLoaded', cekOperatorLogin);

function toggleOpMode() {
  const opMode = document.getElementById('op-mode');
  if (!opMode) return;
  auth.onAuthStateChanged(user => {
    if (user) {
      if (isDefaultOperatorEmail(user.email)) {
        ensureOperatorDoc(user);
        opMode.style.display = 'block';
        return;
      }
      db.collection('users').doc(user.uid).get().then(doc => {
        opMode.style.display = (doc.exists && doc.data().isOperator) ? 'block' : 'none';
      });
    } else {
      opMode.style.display = 'none';
    }
  });
}

function hapusSemuaAkun() {
  if (confirm('Yakin ingin menghapus semua akun verifikasi?\n\nCatatan: ini menghapus data di database. Akun login-nya harus dihapus manual di Firebase Console > Authentication > Users.')) {
    db.collection('users').get().then(snapshot => {
      const hapus = [];
      snapshot.forEach(doc => {
        if (!doc.data().isOperator) {
          hapus.push(db.collection('users').doc(doc.id).delete());
        }
      });
      return Promise.all(hapus);
    }).then(() => {
      alert('Semua akun verifikasi (kecuali operator) telah dihapus dari database.\nJangan lupa hapus juga akun login-nya di Firebase Console > Authentication kalau perlu.');
      toggleOpMode();
      if (window.location.pathname.includes('verifikasi-anggota')) {
        renderMembers();
      }
    }).catch(err => {
      console.error('Gagal hapus semua akun:', err);
      alert('Gagal hapus semua akun: ' + (err && err.message ? err.message : err));
    });
  }
}

function resetPasswordAkun() {
  if (!confirm('Kirim email reset password ke SEMUA anggota satu per satu?\n\nPerhatian: cara ini rawan kena rate-limit Firebase dan masuk spam.\nAnggota yang lupa password harus menghubungi operator.')) {
    return;
  }
  const btn = document.getElementById('reset-password-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengirim...'; }
  db.collection('users').where('isOperator', '==', false).get().then(async snapshot => {
    const emails = [];
    snapshot.forEach(doc => {
      const email = doc.data() && doc.data().email;
      if (email) emails.push(email);
    });
    if (!emails.length) {
      alert('Tidak ada anggota untuk dikirim reset.');
      return;
    }
    let ok = 0;
    const gagal = [];
    // Kirim berurutan + jeda biar tidak kena rate-limit Firebase
    for (const email of emails) {
      try {
        await auth.sendPasswordResetEmail(email);
        ok++;
      } catch (err) {
        console.error('Reset gagal untuk', email, err);
        gagal.push(`${email} (${(err && err.code) || 'error'})`);
      }
      await new Promise(r => setTimeout(r, 800));
    }
    let msg = `Berhasil: ${ok} dari ${emails.length} email terkirim.\nMinta anggota cek Inbox & folder Spam/Promosi.`;
    if (gagal.length) msg += `\n\nGagal (${gagal.length}):\n- ${gagal.slice(0, 10).join('\n- ')}${gagal.length > 10 ? `\n...dan ${gagal.length - 10} lainnya (lihat Console)` : ''}\n\nPenyebab umum gagal: email hanya ada di Firestore tapi tidak ada di Authentication, atau kena rate-limit.`;
    alert(msg);
  }).catch(err => {
    console.error('Gagal ambil daftar anggota:', err);
    alert('Gagal ambil daftar anggota: ' + (err && err.message ? err.message : err));
  }).finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Reset Password Semua'; }
  });
}

function setActiveFilter(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  currentFilter = btn.dataset.filter;
  renderMembers();
}

document.addEventListener('DOMContentLoaded', function() {
  renderMembers();
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      setActiveFilter(this);
    });
  });

  const searchInput = document.getElementById('member-search');
  const searchClear = document.getElementById('search-clear');

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(function () {
      memberSearch = this.value.trim().toLowerCase();
      if (searchClear) searchClear.hidden = !this.value;
      renderMembers();
    }, 300));
  }
  if (searchClear && searchInput) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      memberSearch = '';
      searchClear.hidden = true;
      searchInput.focus();
      renderMembers();
    });
  }
  toggleOpMode();

  const hapusBtn = document.getElementById('hapus-semua-btn');
  if (hapusBtn) hapusBtn.addEventListener('click', hapusSemuaAkun);

  const resetBtn = document.getElementById('reset-password-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetPasswordAkun);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', function () {
    auth.signOut().finally(() => { window.location.href = 'index.html'; });
  });
});

const STATUS_OPTIONS = [
  { v: 'menunggu', t: 'Menunggu' },
  { v: 'terverifikasi', t: 'Terverifikasi' },
  { v: 'ditolak', t: 'Ditolak' },
  { v: 'nonaktif', t: 'Nonaktif' }
];

const STATUS_CLASS = {
  menunggu: 'badge-waiting',
  terverifikasi: 'badge-verified',
  ditolak: 'badge-rejected',
  nonaktif: 'badge-inactive'
};

const STATUS_LABEL = {
  menunggu: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
  nonaktif: 'Nonaktif'
};

let currentFilter = 'semua';
let memberSearch = '';

function getAllMembers() {
  return db.collection('users').orderBy('waktu', 'desc');
}

// Escape teks dari database/input sebelum dimasukkan ke innerHTML (cegah XSS)
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateFilterCounts(members) {
  const counts = {
    semua: members.length,
    menunggu: 0,
    terverifikasi: 0,
    ditolak: 0,
    nonaktif: 0
  };
  members.forEach(m => {
    const s = m.status || 'menunggu';
    if (counts[s] !== undefined) counts[s]++;
  });
  Object.keys(counts).forEach(k => setText('count-' + k, counts[k]));
  return counts;
}

function updateFilterResult(shown, total) {
  const el = document.getElementById('filter-result');
  if (!el) return;
  if (memberSearch) {
    el.innerHTML = `Menampilkan <strong>${shown}</strong> dari <strong>${total}</strong> anggota`;
  } else if (currentFilter === 'semua') {
    el.innerHTML = `Total <strong>${total}</strong> anggota`;
  } else {
    el.innerHTML = `<strong>${shown}</strong> anggota &bull; ${STATUS_LABEL[currentFilter] || currentFilter}`;
  }
}

function renderMembers() {
  const listEl = document.getElementById('member-list');
  if (!listEl) return;

  listEl.innerHTML = [1, 2, 3].map(() => `
    <div class="skeleton-item" aria-hidden="true">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
      </div>
    </div>`).join('');

  db.collection('users').orderBy('waktu', 'desc').get().then(snapshot => {
     const members = snapshot.docs
       .map(doc => ({ id: doc.id, ...doc.data() }))
       .filter(m => !m.isOperator && !isDefaultOperatorEmail(m.email));

     updateFilterCounts(members);

     setText('statTotal', members.length);
     setText('statMenunggu', members.filter(m => (m.status || 'menunggu') === 'menunggu').length);
     setText('statVerified', members.filter(m => m.status === 'terverifikasi').length);
     setText('statNonaktif', members.filter(m => m.status === 'nonaktif').length);

     let filtered = currentFilter === 'semua' ? members : members.filter(m => (m.status || 'menunggu') === currentFilter);

     if (memberSearch) {
       filtered = filtered.filter(m => {
         const hay = `${m.username || ''} ${m.email || ''} ${m.telepon || ''}`.toLowerCase();
         return hay.includes(memberSearch);
       });
     }

     updateFilterResult(filtered.length, members.length);

      if (filtered.length === 0) {
        const SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
        const SVG_USERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="icon">${memberSearch ? SVG_SEARCH : SVG_USERS}</div>
            <p>${memberSearch ? `Tidak ditemukan hasil untuk "<strong>${escapeHtml(memberSearch)}</strong>".` : (currentFilter === 'semua' ? 'Belum ada anggota yang mendaftar.' : 'Tidak ada anggota dengan status ' + (STATUS_LABEL[currentFilter] || currentFilter) + '.')}</p>
         </div>`;
       return;
     }

      listEl.innerHTML = filtered.map(m => {
        const status = m.status || 'menunggu';
        const initial = escapeHtml((m.username || m.email || '?').charAt(0).toUpperCase());
       const options = STATUS_OPTIONS.map(o =>
         `<option value="${o.v}" ${o.v === status ? 'selected' : ''}>${o.t}</option>`
       ).join('');
       const deactivateBtn = status === 'nonaktif'
         ? `<button class="btn-neutral btn-activate" data-uid="${m.id}">Aktifkan</button>`
         : `<button class="btn-neutral btn-deactivate" data-uid="${m.id}">Nonaktifkan</button>`;

       return `
         <div class="member-item">
           <div class="member-info">
              <div class="member-avatar">${m.photoURL ? `<img src="${escapeHtml(m.photoURL)}" alt="" class="member-photo" loading="lazy">` : initial}</div>
             <div class="member-text">
                <span class="m-name">${escapeHtml(m.username || m.email)}</span>
                <span class="m-email">${escapeHtml(m.email)}</span>
                 <span class="m-meta"><span><svg class="svg-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/></svg> ${escapeHtml(m.telepon || '-')}</span><span class="m-sep">|</span><span><svg class="svg-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${escapeHtml(m.waktu || '-')}</span></span>
             </div>
           </div>
           <div class="member-actions">
             <span class="status-badge ${STATUS_CLASS[status]}">${STATUS_LABEL[status]}</span>
             <select class="status-select" data-uid="${m.id}">${options}</select>
             <button class="btn-neutral btn-reset" data-uid="${m.id}">Reset Password</button>
             ${deactivateBtn}
             <button class="btn-danger btn-delete" data-uid="${m.id}">Hapus</button>
           </div>
         </div>`;
     }).join('');

      bindMemberEvents();
    }).catch(err => {
      console.error('Gagal memuat daftar anggota:', err);
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <p>Gagal memuat daftar anggota. Coba muat ulang halaman.</p>
        </div>`;
    });
  }

function updateMember(uid, changes) {
  db.collection('users').doc(uid).update(changes);
}

function bindMemberEvents() {
  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', function () {
      updateMember(this.dataset.uid, { status: this.value });
      renderMembers();
    });
  });

  document.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', function () {
      const uid = this.dataset.uid;
      const btnEl = this;
      db.collection('users').doc(uid).get().then(doc => {
        if (!doc.exists) {
          alert('Data anggota tidak ditemukan.');
          return;
        }
        const email = doc.data().email;
        if (!email) {
          alert('Anggota ini tidak punya email.');
          return;
        }
        if (confirm(`Kirim email reset password ke ${email}?\n\nAnggota diminta cek Inbox & folder Spam/Promosi.`)) {
          btnEl.disabled = true;
          const asal = btnEl.textContent;
          btnEl.textContent = 'Mengirim...';
          auth.sendPasswordResetEmail(email)
            .then(() => {
              alert(`Email reset terkirim ke ${email}.\nMinta anggota cek Inbox & Spam.`);
            })
            .catch(err => {
              console.error('Reset gagal untuk', email, err);
              alert(getResetErrorMessage(err) + `\n\nEmail tujuan: ${email}`);
            })
            .finally(() => {
              btnEl.disabled = false;
              btnEl.textContent = asal;
            });
        }
      }).catch(err => {
        alert('Gagal ambil data anggota: ' + (err && err.message ? err.message : err));
      });
    });
  });

  document.querySelectorAll('.btn-deactivate').forEach(btn => {
    btn.addEventListener('click', function () {
      const uid = this.dataset.uid;
      db.collection('users').doc(uid).get().then(doc => {
        const email = doc.data().email;
        if (confirm(`Nonaktifkan akun ${email}? Anggota tidak dapat login.`)) {
          updateMember(uid, { status: 'nonaktif' });
          renderMembers();
        }
      });
    });
  });

  document.querySelectorAll('.btn-activate').forEach(btn => {
    btn.addEventListener('click', function () {
      const uid = this.dataset.uid;
      db.collection('users').doc(uid).get().then(doc => {
        const email = doc.data().email;
        updateMember(uid, { status: 'menunggu' });
        alert(`Akun ${email} telah diaktifkan.`);
        renderMembers();
      });
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function () {
      const uid = this.dataset.uid;
      db.collection('users').doc(uid).get().then(doc => {
        const email = doc.data().email;
        if (confirm(`Hapus akun ${email} secara permanen?\n\nCatatan: ini menghapus data di database. Akun login-nya harus dihapus manual di Firebase Console > Authentication > Users.`)) {
          db.collection('users').doc(uid).delete()
            .then(() => {
              alert(`Data ${email} dihapus.\nJangan lupa hapus juga akun login-nya di Firebase Console > Authentication kalau perlu.`);
              renderMembers();
            })
            .catch(err => {
              console.error('Gagal hapus akun:', err);
              alert('Gagal hapus akun: ' + (err && err.message ? err.message : err));
            });
        }
      }).catch(err => {
        alert('Gagal ambil data anggota: ' + (err && err.message ? err.message : err));
      });
    });
  });
}

/* =====================================================
   KUSTOMISASI PROFIL — nama tampilan di dashboard user
   Login tetap pakai email; hanya label tampilan yang berubah.
   ===================================================== */
(function () {
  const form = document.getElementById('editNameForm');
  if (!form) return;
  const input = document.getElementById('displayName');
  const errEl = document.getElementById('displayNameError');
  const btn = document.getElementById('saveNameBtn');
  const NAME_RE = /^[a-zA-Z0-9 .'\-]{3,30}$/;

  function showError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = !msg;
    }
    if (input) input.classList.toggle('is-invalid', !!msg);
  }

  function validName(v) {
    if (!v) return 'Nama tidak boleh kosong.';
    if (v.length < 3) return 'Nama minimal 3 karakter.';
    if (v.length > 30) return 'Nama maksimal 30 karakter.';
    if (!NAME_RE.test(v)) return 'Hanya huruf, angka, spasi, titik, petik, dan strip.';
    return '';
  }

  // Prefill dengan nama yang tersimpan (kalau belum ada, biarkan kosong)
  auth.onAuthStateChanged((user) => {
    if (!user || !input || input.value) return;
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists && doc.data().username) input.value = doc.data().username;
      })
      .catch(() => {});
  });

  input?.addEventListener('input', () => showError(''));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    const name = input.value.trim();
    const msg = validName(name);
    if (msg) {
      showError(msg);
      input.focus();
      return;
    }
    showError('');
    btn?.classList.add('is-loading');
    if (btn) btn.disabled = true;

      db.collection('users').doc(user.uid).update({ username: name })
       .then(() => {
         try {
           if (user.updateProfile) user.updateProfile({ displayName: name }).catch(() => {});
         } catch (_) {}
         setText('welcomeName', name);
         setText('profileName', name);
         setText('avatarInitial', (name.charAt(0) || 'R').toUpperCase());
         if (window.showToast) window.showToast('Nama tampilan berhasil disimpan.', 'success');
       })
      .catch((err) => {
        const msgErr = (err && err.code === 'permission-denied')
          ? 'Gagal menyimpan: aturan Firestore menolak. Pastikan rules terbaru sudah di-publish.'
          : 'Gagal menyimpan: ' + (err && err.message ? err.message : err);
        if (window.showToast) window.showToast(msgErr, 'error');
        else alert(msgErr);
      })
      .finally(() => {
        btn?.classList.remove('is-loading');
        if (btn) btn.disabled = false;
      });
  });
})();

/* =====================================================
   MODERN UX LAYER — tanpa mengubah alur yang sudah ada
   ===================================================== */
(function () {
  // 1. Navbar: efek scrolled
  const navbar = document.querySelector('.navbar');
  const onScroll = () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. Mobile menu: tutup via Escape / klik link (delegasi, tahan terhadap updateNav)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      if (hamburger) {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    }
  });
  if (navLinks) {
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a') && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        if (hamburger) {
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // 3. Toast ringan (dipakai untuk info non-kritis, alert/confirm alur tetap)
  function showToast(msg, type = 'info') {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }
  window.showToast = showToast;

  // 4. Reveal on scroll — halus untuk kartu & panel
  const revealSel = '.info-card, .member-item, .op-stat, .about-image, .about-text, .form-container, .login-card, .verifikasi-section, .op-mode-panel, .op-header, .status-banner, .dash-profile';
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08 }) : null;

  function observeReveals(root = document) {
    if (!io) return;
    root.querySelectorAll(revealSel).forEach((el) => {
      if (!el.classList.contains('reveal') && !el.classList.contains('in')) {
        el.classList.add('reveal');
        io.observe(el);
      }
    });
  }
observeReveals();

  // Daftar anggota di-render ulang via Firestore → amati lagi tiap render
  const memberList = document.getElementById('member-list');
  let memberObserver = null;
  if (memberList && 'MutationObserver' in window) {
    memberObserver = new MutationObserver(() => {
      requestAnimationFrame(() => observeReveals(memberList));
    });
    memberObserver.observe(memberList, { childList: true });
  }

  // Klik kartu statistik → terapkan filter yang sesuai
  const statToFilter = {
    statTotal: 'semua',
    statMenunggu: 'menunggu',
    statVerified: 'terverifikasi',
    statNonaktif: 'nonaktif'
  };
  Object.keys(statToFilter).forEach((id) => {
    const card = document.getElementById(id)?.closest('.op-stat');
    if (!card) return;
    card.classList.add('clickable');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('title', 'Klik untuk memfilter: ' + statToFilter[id]);
    const go = () => {
      const btn = document.querySelector(`.filter-btn[data-filter="${statToFilter[id]}"]`);
      if (btn) {
        btn.click();
        document.querySelector('.verifikasi-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  // 7. Loading state pada tombol submit form auth
  ['loginForm', 'daftarForm', 'operatorLoginForm'].forEach((formId) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', () => {
      const btn = form.querySelector('.btn-submit');
      if (btn && !btn.classList.contains('is-loading')) {
        btn.classList.add('is-loading');
        btn.disabled = true;
        // Pengaman: kembalikan jika tidak ada redirect (mis. error validasi)
        setTimeout(() => {
          btn.classList.remove('is-loading');
          btn.disabled = false;
        }, 9000);
      }
    });
  });
})();


