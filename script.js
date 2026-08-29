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
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const telepon = document.getElementById('telepon').value;
  if (username && password && telepon) {
    // Simpan status verifikasi ke localStorage
    localStorage.setItem(`verifikasi_${username}`, JSON.stringify({
      status: 'menunggu',
      username: username,
      email: 'redkarbalikpapan@gmail.com',
      password: 'Redkar86.'
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