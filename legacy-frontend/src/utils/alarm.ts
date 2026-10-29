export const playAlarm = (): void => {
	try {
		type ExtendedWindow = typeof window & { webkitAudioContext?: typeof AudioContext };
		const AudioCtx = window.AudioContext || (window as ExtendedWindow).webkitAudioContext;
		if (!AudioCtx) return;
		const ctx = new AudioCtx();

		const beep = (freq: number, startTime: number, dur: number) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.4, ctx.currentTime + startTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + dur);
			osc.start(ctx.currentTime + startTime);
			osc.stop(ctx.currentTime + startTime + dur);
		};

		beep(880, 0, 0.2);
		beep(880, 0.28, 0.2);
		beep(880, 0.56, 0.2);
		beep(1100, 0.84, 0.45);
		beep(880, 1.4, 0.2);
		beep(1100, 1.7, 0.6);
	} catch {
		// AudioContext not available in this environment
	}
};

export const formatSeconds = (totalSeconds: number): string => {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
