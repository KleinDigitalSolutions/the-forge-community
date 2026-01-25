let gtaMenuAudio: HTMLAudioElement | null = null;
let gtaMenuReady = false;
let gtaWelcomeAudio: HTMLAudioElement | null = null;

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

const ensureWelcomeAudio = () => {
  if (!gtaWelcomeAudio) {
    gtaWelcomeAudio = new Audio('/audio/gta-welcome.mp3');
    gtaWelcomeAudio.preload = 'auto';
    gtaWelcomeAudio.volume = 0.4;
  }
};

export function playGtaWelcomeTrack() {
  if (typeof window === 'undefined') return;
  ensureWelcomeAudio();
  if (!gtaWelcomeAudio) return;
  gtaWelcomeAudio.currentTime = 0;
  gtaWelcomeAudio.play().catch(() => {});
}
