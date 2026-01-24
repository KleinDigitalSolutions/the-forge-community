let gtaMenuAudio: HTMLAudioElement | null = null;

export function playGtaMenuSound() {
  if (typeof window === 'undefined') return;
  if (!gtaMenuAudio) {
    gtaMenuAudio = new Audio('/audio/gta-menu.mp3');
    gtaMenuAudio.preload = 'auto';
    gtaMenuAudio.volume = 0.35;
  }
  gtaMenuAudio.currentTime = 0;
  gtaMenuAudio.play().catch(() => {});
}
