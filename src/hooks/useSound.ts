// Custom hook for playing sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playTaskSound = (completed: boolean) => {
  // Sound disabled by user request
  return;
};

export const playCopySound = () => {
  // Sound disabled by user request
  return;
};
