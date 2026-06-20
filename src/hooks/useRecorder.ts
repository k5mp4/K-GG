import { useState, useRef } from 'react';
import { useGradientStore } from '../store/gradientStore';

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const { animation } = useGradientStore();

  const startRecording = () => {
    // GradientCanvas が最初の canvas 要素
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const stream = canvas.captureStream(animation.fps);
    const preferredMime = 'video/webm;codecs=vp9';
    const mimeType = MediaRecorder.isTypeSupported(preferredMime) ? preferredMime : 'video/webm';

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `gradient_${Date.now()}.webm`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setRecording(false);
      setProgress(0);
    };

    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);

    const durationMs = animation.duration * 1000;
    const startTime = Date.now();

    const updateProgress = () => {
      const p = Math.min((Date.now() - startTime) / durationMs, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(updateProgress);
    };
    requestAnimationFrame(updateProgress);

    setTimeout(() => recorder.stop(), durationMs);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return { recording, progress, startRecording, stopRecording };
}
