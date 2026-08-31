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

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

function togglePassword(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (field.type === 'password') {
    field.type = 'text';
    btn.textContent = '&#128066;';
  } else {
    field.type = 'password';
    btn.textContent = '&#128065;';
  }
}

function updateNav() {
  if (!navLinks) return;
  const path = window.location.pathname.split('/').pop() || 'index.html';

  auth.onAuthStateChanged(user => {
    const isOperator = user && user.email === 'OPERATOR_EMAIL';
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
        db.collection('users').doc(user.uid).get()
          .then(doc => {
            if (doc.exists) {
              const data = doc.data();
              if (data.status === 'nonaktif') {
                alert('Akun Anda telah dinonaktifkan oleh operator.');
                auth.signOut();
              } else {
                window.location.href = 'dashboard.html';
              }
            }
          })
          .catch(() => {
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

function handleDaftar(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const telepon = document.getElementById('telepon').value;
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
  const email = document.getElementById('operatorEmail').value;
  const password = document.getElementById('operatorPassword').value;

  if (email && password) {
    auth.signInWithEmailAndPassword(email, password)
      .then(result => {
        db.collection('users').doc(result.user.uid).get()
          .then(doc => {
            if (doc.exists && doc.data().isOperator) {
              alert('Login operator berhasil!');
              window.location.href = 'verifikasi-anggota.html';
            } else {
              alert('Akun ini bukan akun operator.');
              auth.signOut();
            }
          })
          .catch(() => {
            alert('Data operator tidak ditemukan.');
            auth.signOut();
          });
      })
      .catch(err => {
        alert('Username atau password operator salah!');
      });
  }
  return false;
}

function cekOperatorLogin() {
  if (!window.location.pathname.includes('verifikasi-anggota')) return;
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'operator-login.html';
    } else {
      db.collection('users').doc(user.uid).get()
        .then(doc => {
          if (!doc.exists || !doc.data().isOperator) {
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
      db.collection('users').doc(user.uid).get().then(doc => {
        opMode.style.display = (doc.exists && doc.data().isOperator) ? 'block' : 'none';
      });
    } else {
      opMode.style.display = 'none';
    }
  });
}

function hapusSemuaAkun() {
  if (confirm('Yakin ingin menghapus semua akun verifikasi?')) {
    db.collection('users').get().then(snapshot => {
      snapshot.forEach(doc => {
        if (!doc.data().isOperator) {
          db.collection('users').doc(doc.id).delete();
        }
      });
      alert('Semua akun verifikasi (kecuali operator) telah dihapus.');
      toggleOpMode();
      if (window.location.pathname.includes('verifikasi-anggota')) {
        renderMembers();
      }
    });
  }
}

function resetPasswordAkun() {
  if (confirm('Yakin kirim email reset password ke semua anggota?')) {
    db.collection('users').where('isOperator', '==', false).get().then(snapshot => {
      let count = 0;
      snapshot.forEach(doc => {
        const email = doc.data().email;
        auth.sendPasswordResetEmail(email)
          .then(() => { count++; })
          .catch(() => {});
      });
      setTimeout(() => {
        alert(`Email reset password dikirim ke ${count} anggota.`);
      }, 2000);
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  toggleOpMode();

  const hapusBtn = document.getElementById('hapus-semua-btn');
  if (hapusBtn) hapusBtn.addEventListener('click', hapusSemuaAkun);

  const resetBtn = document.getElementById('reset-password-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetPasswordAkun);
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

function getAllMembers() {
  return db.collection('users').orderBy('waktu', 'desc');
}

function renderMembers() {
  const listEl = document.getElementById('member-list');
  if (!listEl) return;

  db.collection('users').orderBy('waktu', 'desc').get().then(snapshot => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    document.getElementById('statTotal').textContent = members.length;
    document.getElementById('statMenunggu').textContent = members.filter(m => m.status === 'menunggu').length;
    document.getElementById('statVerified').textContent = members.filter(m => m.status === 'terverifikasi').length;
    document.getElementById('statNonaktif').textContent = members.filter(m => m.status === 'nonaktif').length;

    if (members.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="icon">&#128101;</div>
          <p>Belum ada anggota yang mendaftar.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = members.map(m => {
      const status = m.status || 'menunggu';
      const initial = (m.username || m.email || '?').charAt(0).toUpperCase();
      const options = STATUS_OPTIONS.map(o =>
        `<option value="${o.v}" ${o.v === status ? 'selected' : ''}>${o.t}</option>`
      ).join('');
      const deactivateBtn = status === 'nonaktif'
        ? `<button class="btn-neutral btn-activate" data-uid="${m.id}">Aktifkan</button>`
        : `<button class="btn-neutral btn-deactivate" data-uid="${m.id}">Nonaktifkan</button>`;

      return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-avatar">${initial}</div>
            <div class="member-text">
              <span class="m-name">${m.username || m.email}</span>
              <span class="m-email">${m.email}</span>
              <span class="m-meta">&#128241; ${m.telepon || '-'} &nbsp;|&nbsp; &#128197; ${m.waktu || '-'}</span>
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
      db.collection('users').doc(uid).get().then(doc => {
        const email = doc.data().email;
        if (confirm(`Kirim email reset password ke ${email}?`)) {
          auth.sendPasswordResetEmail(email)
            .then(() => {
              alert(`Email reset password dikirim ke ${email}.`);
              updateMember(uid, { status: 'menunggu' });
              renderMembers();
            })
            .catch(err => {
              alert('Gagal kirim reset email: ' + err.message);
            });
        }
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
        if (confirm(`Hapus akun ${email} secara permanen?`)) {
          db.collection('users').doc(uid).delete();
          renderMembers();
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', renderMembers);
