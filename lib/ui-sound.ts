let gtaMenuAudio: HTMLAudioElement | null = null;
let gtaMenuReady = false;

const ensureAudio = () => {
  if (!gtaMenuAudio) {
    gtaMenuAudio = new Audio('/audio/gta-menu.mp3');
    gtaMenuAudio.preload = 'auto';
    gtaMenuAudio.volume = 0.35;
  }
};

export function primeGtaMenuSound() {
  if (typeof window === 'undefined' || gtaMenuReady) return;
  ensureAudio();
  if (!gtaMenuAudio) return;

  gtaMenuAudio.volume = 0;
  gtaMenuAudio
    .play()
    .then(() => {
      gtaMenuAudio?.pause();
      if (gtaMenuAudio) {
        gtaMenuAudio.currentTime = 0;
        gtaMenuAudio.volume = 0.35;
      }
      gtaMenuReady = true;
    })
    .catch(() => {});
}

export function playGtaMenuSound() {
  if (typeof window === 'undefined') return;
  ensureAudio();
  if (!gtaMenuAudio) return;
  gtaMenuAudio.volume = 0.35;
  gtaMenuAudio.currentTime = 0;
  gtaMenuAudio.play().catch(() => {});
}
