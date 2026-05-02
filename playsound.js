const moveSound = new Audio('./src/sounds/move-opponent.webm');
const captureSound = new Audio('./src/sounds/capture.mp3');
const castleSound = new Audio('./src/sounds/castle.webm');
const checkSound = new Audio('./src/sounds/move-check.webm');

// Ensure the audio files are preloaded and check for errors
moveSound.addEventListener('canplaythrough', () => console.log('Move sound loaded'), false);
moveSound.addEventListener('error', (e) => console.error('Error loading move sound:', e), false);

captureSound.addEventListener('canplaythrough', () => console.log('Capture sound loaded'), false);
captureSound.addEventListener('error', (e) => console.error('Error loading capture sound:', e), false);

castleSound.addEventListener('canplaythrough', () => console.log('castle sound loaded'), false);
castleSound.addEventListener('error', (e) => console.error('Error loading castle sound:', e), false);

checkSound.addEventListener('canplaythrough', () => console.log('check sound loaded'), false);
checkSound.addEventListener('error', (e) => console.error('Error loading check sound:', e), false);

function playSound(sound) {
    sound.currentTime = 0; // Rewind to the start
    sound.play().catch(error => console.error('Error playing sound:', error));
}

document.addEventListener('click', function initAudio() {
    moveSound.play().then(() => moveSound.pause());
    captureSound.play().then(() => captureSound.pause());
    document.removeEventListener('click', initAudio);
});