import canvasConfetti from 'canvas-confetti';

/**
 * Dispara uma explosão de confete celebratória.
 * @param colors Array de cores hexadecimais (opcional)
 */
export const triggerCelebration = (colors?: string[]) => {
  const defaultColors = ['#D4AF37', '#F5E6CC', '#AA8844', '#FFFFFF'];
  const confettiColors = colors || defaultColors;

  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: confettiColors,
  };

  function fire(particleRatio: number, opts: canvasConfetti.Options) {
    canvasConfetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

/**
 * Dispara confetes contínuos pelas laterais (efeito canhão).
 */
export const triggerSideCannons = (durationSeconds = 3, colors?: string[]) => {
  const end = Date.now() + (durationSeconds * 1000);
  const confettiColors = colors || ['#D4AF37', '#AA8844'];

  (function frame() {
    canvasConfetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: confettiColors
    });
    canvasConfetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: confettiColors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};
