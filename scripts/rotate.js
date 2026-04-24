(() => {
  const photo = document.querySelector('.photo');
  if (!photo) return;
  const imgs = Array.from(photo.querySelectorAll('.photo-img'));
  if (imgs.length < 2) return;

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let queue = shuffle(imgs.map((_, i) => i));
  let idx = queue.shift();
  imgs.forEach((img, i) => img.classList.toggle('is-active', i === idx));

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  setInterval(() => {
    imgs[idx].classList.remove('is-active');
    if (queue.length === 0) {
      queue = shuffle(imgs.map((_, i) => i).filter((i) => i !== idx));
    }
    idx = queue.shift();
    imgs[idx].classList.add('is-active');
  }, 6000);
})();
