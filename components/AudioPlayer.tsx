'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';

type AudioPlayerProps = {
  src: string;
  title?: string;
  chapter?: string;
  onEnded?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

export function AudioPlayer({ src, title, chapter, onEnded, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onProgress?.(audio.currentTime, audio.duration);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onEndedHandler = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const onError = () => {
      setError('Erreur de chargement audio');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEndedHandler);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEndedHandler);
      audio.removeEventListener('error', onError);
    };
  }, [onEnded, onProgress]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const v = Number(e.target.value);
    audio.volume = v;
    setVolume(v);
    if (v === 0) setMuted(true);
    else setMuted(false);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  const onRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-xl">
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="mb-3">
          <div className="text-xs text-brand-100 uppercase tracking-wide">{chapter || 'Audio'}</div>
          <div className="font-bold truncate">{title}</div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={onSeek}
          className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
          style={{
            background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100 || 0}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100 || 0}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-brand-100 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-white/10 rounded-full transition"
            aria-label="Muet"
          >
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={muted ? 0 : volume}
            onChange={onVolumeChange}
            className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => skip(-15)}
            className="p-2 hover:bg-white/10 rounded-full transition"
            aria-label="-15s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 bg-white text-brand-600 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg disabled:opacity-50"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => skip(15)}
            className="p-2 hover:bg-white/10 rounded-full transition"
            aria-label="+15s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <select
            value={playbackRate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="bg-white/10 text-white text-xs font-semibold rounded-lg px-2 py-1 border border-white/20 cursor-pointer"
          >
            <option value="0.75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-200 bg-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
