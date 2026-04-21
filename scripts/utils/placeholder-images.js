const PLACEHOLDER_IMAGES = [
  "/images/placeholders/legal-1.png",
  "/images/placeholders/legal-2.png",
  "/images/placeholders/legal-3.png",
  "/images/placeholders/legal-4.png",
  "/images/placeholders/legal-5.png",
  "/images/placeholders/legal-6.png",
  "/images/placeholders/legal-7.png",
  "/images/placeholders/legal-8.png",
  "/images/placeholders/legal-9.png",
  "/images/placeholders/legal-10.png"
];

function pickRandomPlaceholder() {
  const index = Math.floor(Math.random() * PLACEHOLDER_IMAGES.length);
  return PLACEHOLDER_IMAGES[index];
}

module.exports = {
  PLACEHOLDER_IMAGES,
  pickRandomPlaceholder
};
