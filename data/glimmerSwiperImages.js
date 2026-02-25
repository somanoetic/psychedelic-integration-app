/**
 * Glimmer Swiper Image Library
 *
 * Local images bundled with the app for instant loading and offline support.
 * Original source: Unsplash (free, no attribution required)
 *
 * To replace a photo:
 * 1. Download a new 400x400 jpg to the appropriate folder
 * 2. Update the require() path below
 *
 * Face photos should show clearly smiling/happy expressions.
 * Nature photos should be calming landscapes.
 */

// Smiling faces - diverse, genuine, warm, clearly happy expressions
export const SMILING_FACES = [
  { id: 'face_1', source: require('../assets/images/glimmer-swiper/faces/face_1.jpg'), category: 'face' },
  { id: 'face_2', source: require('../assets/images/glimmer-swiper/faces/face_2.jpg'), category: 'face' },
  { id: 'face_3', source: require('../assets/images/glimmer-swiper/faces/face_3.jpg'), category: 'face' },
  { id: 'face_4', source: require('../assets/images/glimmer-swiper/faces/face_4.jpg'), category: 'face' },
  { id: 'face_5', source: require('../assets/images/glimmer-swiper/faces/face_5.jpg'), category: 'face' },
  { id: 'face_6', source: require('../assets/images/glimmer-swiper/faces/face_6.jpg'), category: 'face' },
  { id: 'face_7', source: require('../assets/images/glimmer-swiper/faces/face_7.jpg'), category: 'face' },
  { id: 'face_8', source: require('../assets/images/glimmer-swiper/faces/face_8.jpg'), category: 'face' },
  { id: 'face_9', source: require('../assets/images/glimmer-swiper/faces/face_9.jpg'), category: 'face' },
  { id: 'face_10', source: require('../assets/images/glimmer-swiper/faces/face_10.jpg'), category: 'face' },
  { id: 'face_11', source: require('../assets/images/glimmer-swiper/faces/face_11.jpg'), category: 'face' },
  { id: 'face_12', source: require('../assets/images/glimmer-swiper/faces/face_12.jpg'), category: 'face' },
  { id: 'face_13', source: require('../assets/images/glimmer-swiper/faces/face_13.jpg'), category: 'face' },
  { id: 'face_14', source: require('../assets/images/glimmer-swiper/faces/face_14.jpg'), category: 'face' },
  { id: 'face_15', source: require('../assets/images/glimmer-swiper/faces/face_15.jpg'), category: 'face' },
  { id: 'face_16', source: require('../assets/images/glimmer-swiper/faces/face_16.jpg'), category: 'face' },
  { id: 'face_17', source: require('../assets/images/glimmer-swiper/faces/face_17.jpg'), category: 'face' },
  { id: 'face_18', source: require('../assets/images/glimmer-swiper/faces/face_18.jpg'), category: 'face' },
  { id: 'face_19', source: require('../assets/images/glimmer-swiper/faces/face_19.jpg'), category: 'face' },
  { id: 'face_20', source: require('../assets/images/glimmer-swiper/faces/face_20.jpg'), category: 'face' },
];

// Nature scenes - calming landscapes, water, forests, sunsets
export const NATURE_SCENES = [
  { id: 'nature_1', source: require('../assets/images/glimmer-swiper/nature/nature_1.jpg'), category: 'nature' },
  { id: 'nature_2', source: require('../assets/images/glimmer-swiper/nature/nature_2.jpg'), category: 'nature' },
  { id: 'nature_3', source: require('../assets/images/glimmer-swiper/nature/nature_3.jpg'), category: 'nature' },
  { id: 'nature_4', source: require('../assets/images/glimmer-swiper/nature/nature_4.jpg'), category: 'nature' },
  { id: 'nature_5', source: require('../assets/images/glimmer-swiper/nature/nature_5.jpg'), category: 'nature' },
  { id: 'nature_6', source: require('../assets/images/glimmer-swiper/nature/nature_6.jpg'), category: 'nature' },
  { id: 'nature_7', source: require('../assets/images/glimmer-swiper/nature/nature_7.jpg'), category: 'nature' },
  { id: 'nature_8', source: require('../assets/images/glimmer-swiper/nature/nature_8.jpg'), category: 'nature' },
  { id: 'nature_9', source: require('../assets/images/glimmer-swiper/nature/nature_9.jpg'), category: 'nature' },
  { id: 'nature_10', source: require('../assets/images/glimmer-swiper/nature/nature_10.jpg'), category: 'nature' },
  { id: 'nature_11', source: require('../assets/images/glimmer-swiper/nature/nature_11.jpg'), category: 'nature' },
  { id: 'nature_12', source: require('../assets/images/glimmer-swiper/nature/nature_12.jpg'), category: 'nature' },
  { id: 'nature_13', source: require('../assets/images/glimmer-swiper/nature/nature_13.jpg'), category: 'nature' },
  { id: 'nature_14', source: require('../assets/images/glimmer-swiper/nature/nature_14.jpg'), category: 'nature' },
  { id: 'nature_15', source: require('../assets/images/glimmer-swiper/nature/nature_15.jpg'), category: 'nature' },
  { id: 'nature_16', source: require('../assets/images/glimmer-swiper/nature/nature_16.jpg'), category: 'nature' },
  { id: 'nature_17', source: require('../assets/images/glimmer-swiper/nature/nature_17.jpg'), category: 'nature' },
  { id: 'nature_18', source: require('../assets/images/glimmer-swiper/nature/nature_18.jpg'), category: 'nature' },
  { id: 'nature_19', source: require('../assets/images/glimmer-swiper/nature/nature_19.jpg'), category: 'nature' },
  { id: 'nature_20', source: require('../assets/images/glimmer-swiper/nature/nature_20.jpg'), category: 'nature' },
];

/**
 * Generate shuffled deck of images for game
 * @param {number} count - Number of images per category
 */
export const generateDeck = (count = 25) => {
  const faces = [...SMILING_FACES].sort(() => Math.random() - 0.5).slice(0, count);
  const nature = [...NATURE_SCENES].sort(() => Math.random() - 0.5).slice(0, count);

  // Interleave faces and nature for balanced gameplay
  const deck = [];
  for (let i = 0; i < count; i++) {
    if (i < faces.length) deck.push(faces[i]);
    if (i < nature.length) deck.push(nature[i]);
  }

  // Final shuffle
  return deck.sort(() => Math.random() - 0.5);
};

/**
 * Get total available images
 */
export const getTotalImages = () => ({
  faces: SMILING_FACES.length,
  nature: NATURE_SCENES.length,
  total: SMILING_FACES.length + NATURE_SCENES.length,
});
