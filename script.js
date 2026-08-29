const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

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

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (email && password) {
    // Cek status verifikasi dari localStorage
    const dataVerifikasi = localStorage.getItem(`verifikasi_${email}`);
    if (dataVerifikasi) {
      const verifikasi = JSON.parse(dataVerifikasi);
      if (verifikasi.status === 'menunggu') {
        alert('Sedang menunggu verifikasi dari operator...');
        return false;
      }
    }
    alert('Terima kasih! Masuk berhasil. Selamat datang di Relawan Damkar.');
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
    // Cek apakah email sudah terdaftar
    const existingUser = localStorage.getItem(`verifikasi_${email}`);
    if (existingUser) {
      alert('Akun sudah terdaftar!');
      return false;
    }
    // Simpan status verifikasi ke localStorage
    localStorage.setItem(`verifikasi_${email}`, JSON.stringify({
      status: 'menunggu',
      username: email,
      email: email,
      password: 'Redkar86.',
      waktu: new Date().toLocaleString('id-ID')
    }));
    alert('Akun berhasil dibuat! Silakan tunggu verifikasi dari operator.');
    document.getElementById('daftarForm').reset();
    window.location.href = 'login.html';
    return false;
  }
  return false;
}

const sections = document.querySelectorAll('section');
const navAnchors = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navAnchors.forEach(anchor => {
    anchor.classList.remove('active');
    if (anchor.getAttribute('href') === `#${current}`) {
      anchor.classList.add('active');
    }
  });
});
// Operator login credentials (simpan di localStorage)
const OPERATOR_CREDENTIALS = {
  username: 'operator',
  password: 'operator123'
};

// Fungsi login operator
function loginOperator(e) {
  e.preventDefault();
  const username = document.getElementById('operatorUsername').value;
  const password = document.getElementById('operatorPassword').value;
  
  if (username === OPERATOR_CREDENTIALS.username && password === OPERATOR_CREDENTIALS.password) {
    // Simpan status login operator ke localStorage
    localStorage.setItem('operator_login', 'true');
    alert('Login operator berhasil!');
    window.location.href = 'verifikasi-anggota.html';
  } else {
    alert('Username atau password operator salah!');
  }
}

// Cek apakah sudah login operator (hanya untuk halaman verifikasi)
function cekOperatorLogin() {
  if (!window.location.pathname.includes('verifikasi-anggota')) return;
  const loginStatus = localStorage.getItem('operator_login');
  if (loginStatus !== 'true') {
    window.location.href = 'operator-login.html';
  }
}

// Jalankan cek login saat halaman dimuat
document.addEventListener('DOMContentLoaded', cekOperatorLogin);

// Bind form login operator
const operatorLoginForm = document.getElementById('operatorLoginForm');
if (operatorLoginForm) {
  operatorLoginForm.addEventListener('submit', loginOperator);
}

// Fitur Op Mode - hanya aktif ketika operator login
function toggleOpMode() {
  const opMode = document.getElementById('op-mode');
  const isLoggedIn = localStorage.getItem('operator_login') === 'true';
  if (opMode) {
    opMode.style.display = isLoggedIn ? 'block' : 'none';
  }
}

// Hapus semua akun verifikasi dari localStorage
function hapusSemuaAkun() {
  if (confirm('Yakin ingin menghapus semua akun verifikasi?')) {
    for (let i = 0; i < localStorage.length; i++) {
      const kunci = localStorage.key(i);
      if (kunci && kunci.startsWith('verifikasi_')) {
        localStorage.removeItem(kunci);
      }
    }
    alert('Semua akun verifikasi telah dihapus.');
    toggleOpMode();
    // Refresh verifikasi-anggota jika halaman terbuka
    if (window.location.pathname.includes('verifikasi-anggota')) {
      window.location.href = 'verifikasi-anggota.html';
    }
  }
}

// Reset password akun (membalik status ke awal/bersihkan password)
function resetPasswordAkun() {
  if (confirm('Yakin ingin mereset password untuk semua akun verifikasi?')) {
    for (let i = 0; i < localStorage.length; i++) {
      const kunci = localStorage.key(i);
      if (kunci && kunci.startsWith('verifikasi_')) {
        const data = JSON.parse(localStorage.getItem(kunci));
        // Reset password ke default dan status ke pending
        data.password = 'Redkar86.';
        data.status = 'menunggu';
        localStorage.setItem(kunci, JSON.stringify(data));
      }
    }
    alert('Password akun verifikasi telah direset ke Redkar86.');
    toggleOpMode();
    // Refresh verifikasi-anggota jika halaman terbuka
    if (window.location.pathname.includes('verifikasi-anggota')) {
      window.location.href = 'verifikasi-anggota.html';
    }
  }
}

// Jalankan toggle op mode saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  toggleOpMode();
  
  // Event listener untuk hapus semua akun
  const hapusBtn = document.getElementById('hapus-semua-btn');
  if (hapusBtn) {
    hapusBtn.addEventListener('click', hapusSemuaAkun);
  }
  
  // Event listener untuk reset password
  const resetBtn = document.getElementById('reset-password-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetPasswordAkun);
  }
});
