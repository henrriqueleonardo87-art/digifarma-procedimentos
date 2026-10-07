// Utilitário de Som de Notificação via Web Audio API (zero dependências externas)
export function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Se o contexto estiver suspenso por política de autoplay, tenta retomar
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Criar oscilador duplo para tom de notificação agradável (harmônico 587Hz D5 -> 880Hz A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // Ré
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // Lá

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.32);

    // Segundo tom suave em harmonia rápida
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);

    gain2.gain.setValueAtTime(0.001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch (err) {
    console.debug('Som de notificação suprimido pelo navegador:', err);
  }
}
