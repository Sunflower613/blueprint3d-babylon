/**
 * 实时合成风铃清脆声的 Web Audio API 模块
 */
export function playWindChimeSound() {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    
    // 风铃由4个高频正弦波音色错开播放（采用清脆的 Pentatonic/A九和弦高音组合）
    const frequencies = [880, 1046.5, 1318.5, 1568]; // A5, C6, E6, G6
    const now = audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      // 稍微错开播放时间（50ms-150ms），模拟微风吹动金属管依次碰撞的声音
      const timeOffset = index * 0.08 + Math.random() * 0.04;
      const triggerTime = now + timeOffset;

      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.type = 'sine'; // 正弦波最纯净，适合模拟风铃金属声
      osc.frequency.setValueAtTime(freq, triggerTime);

      // 设计起音与指数衰减包络
      gainNode.gain.setValueAtTime(0, triggerTime);
      gainNode.gain.linearRampToValueAtTime(0.12, triggerTime + 0.01); // 10ms 快速起音 (Attack)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 1.2); // 1.2秒缓慢衰减 (Decay)

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.start(triggerTime);
      osc.stop(triggerTime + 1.3); // 预留余音时间
    });
  } catch (error) {
    console.warn('Unable to play wind chime sound', error);
  }
}
