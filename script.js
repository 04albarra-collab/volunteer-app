// Fungsi untuk animasi scroll smooth
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Fungsi untuk form submission
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      experience: document.getElementById('experience').value
    };
    
    // Simulasi pengiriman form
    alert('Terima kasih ' + formData.name + '! Formulir pendaftaran volunteer berhasil dikirim.');
    contactForm.reset();
  });
}

// Fungsi untuk menampilkan pesan saat hover event card
document.querySelectorAll('.event-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    const date = this.querySelector('.event-date');
    if (date) {
      date.style.transform = 'scale(1.1)';
      date.style.transition = 'transform 0.3s';
    }
  });
  
  card.addEventListener('mouseleave', function() {
    const date = this.querySelector('.event-date');
    if (date) {
      date.style.transform = 'scale(1)';
    }
  });
});

// Fungsi untuk menambahkan class active pada nav link saat scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    
    if (pageYOffset >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});