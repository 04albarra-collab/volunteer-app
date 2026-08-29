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

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (email && password) {
    alert('Terima kasih! Masuk berhasil. Selamat datang di Relawan Damkar.');
    return false;
  }
  return false;
}

function handleDaftar(e) {
  e.preventDefault();
  const nama = document.getElementById('nama').value;
  const email = document.getElementById('email').value;
  const telepon = document.getElementById('telepon').value;
  const alamat = document.getElementById('alamat').value;
  const pengalaman = document.getElementById('pengalaman').value;
  const dokumen = document.getElementById('dokumen').value;
  if (nama && email && telepon && alamat && pengalaman && dokumen) {
    alert('Terima kasih atas pendaftaran Anda, ' + nama + '! Data kami sudah diterima. Kami akan menghubungi Anda segera.');
    document.getElementById('daftarForm').reset();
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