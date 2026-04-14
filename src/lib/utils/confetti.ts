import confetti from 'canvas-confetti';

interface ConfettiOptions {
  colors?: string[];
  duration?: number;
}

/**
 * Dispara uma celebração de confetes e corações com as cores do tema.
 * @param options Cores e duração da animação
 */
export const celebrateGiftSuccess = (options: ConfettiOptions = {}) => {
  const duration = options.duration || 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Confetes Normais
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: options.colors || ['#B2AC88', '#FAF9F6', '#8FA89B'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: options.colors || ['#B2AC88', '#FAF9F6', '#8FA89B'],
    });

    // Efeito de Corações (Simulado com formas ou cores específicas)
    // Nota: canvas-confetti suporta formas customizadas via `shapes: ['circle', 'square']`.
    // Para corações reais, precisaríamos de uma imagem ou SVG path, mas usaremos tons de vermelho/rosa misturados ao tema.
  }, 250);
};

export const shootHearts = (colors: string[] = ['#ff0000', '#ff69b4']) => {
  const scalar = 2;
  const heart = confetti.shapeFromText({ text: '❤️', scalar });

  confetti({
    shapes: [heart],
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors,
  });
};
