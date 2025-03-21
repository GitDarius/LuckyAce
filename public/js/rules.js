const images = window.rulesArray;
let currentIndex = 0;
let animation = false;

const prevBtn = document.getElementById('rules_prev_img');
const nextBtn = document.getElementById('rules_next_img');
const closeBtn = document.getElementById('rules_close');
const imageContainer = document.getElementById('image_container');
const rulesBox = document.getElementById("rules_box");

document.getElementById('current_image').src = images[currentIndex];

function changeImage(direction) {
  const newImage = document.createElement('img');
  newImage.src = images[currentIndex];
  newImage.alt = "Carousel Image";
  
  newImage.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
  
  imageContainer.appendChild(newImage);
  
  newImage.getBoundingClientRect();
  
  const currentImage = document.getElementById('current_image');
  
  if (direction === 'next') {
    currentImage.style.transform = 'translateX(-100%)';
  } else {
    currentImage.style.transform = 'translateX(100%)';
  }
  newImage.style.transform = 'translateX(0)';
  
  currentImage.addEventListener('transitionend', function handler() {
    currentImage.removeEventListener('transitionend', handler);
    imageContainer.removeChild(currentImage);
    newImage.id = 'current_image';
  });
}

prevBtn.addEventListener('click', async function () {
  if (animation) return;
  currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  changeImage('prev');
  animation = true;
  await sleep(550);
  animation = false;
});

nextBtn.addEventListener('click', async function () {
  if (animation) return;
  currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
  changeImage('next');
  animation = true;
  await sleep(550);
  animation = false;
});

closeBtn.addEventListener('click', closeRules);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function closeRules() {
  currentIndex = 0;
  rulesBox.hidden = true;
}

function openRules() {
  currentIndex = 0;
  document.getElementById('current_image').src = images[0];
  rulesBox.hidden = false;
}
