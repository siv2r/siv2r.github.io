(() => {
  const photo = document.querySelector('.photo');
  if (!photo) return;
  const imgs = photo.querySelectorAll('.photo-img');
  if (imgs.length < 2) return;

  let idx = Math.floor(Math.random() * imgs.length);
  imgs.forEach((img, i) => img.classList.toggle('is-active', i === idx));

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  setInterval(() => {
    imgs[idx].classList.remove('is-active');
    idx = (idx + 1) % imgs.length;
    imgs[idx].classList.add('is-active');
  }, 5000);
})();
