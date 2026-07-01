import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicAsset from "@/assets/luka-negara.mp3.asset.json";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startMusic = useCallback((force = false) => {
    if (userPausedRef.current && !force) return;

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(musicAsset.url);
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;
    }

    audio.muted = false;
    audio.volume = 0.6;
    audio.load();

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
  }, []);

  useEffect(() => {
    if (isPlaying || userPausedRef.current) return;

    const unlock = () => startMusic();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "touchend", "click", "keydown"];
    const options: AddEventListenerOptions = { capture: true, passive: true };

    events.forEach((eventName) => window.addEventListener(eventName, unlock, options));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, unlock, options));
    };
  }, [isPlaying, startMusic]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      userPausedRef.current = false;
      startMusic(true);
      return;
    }

    userPausedRef.current = true;
    audio.pause();
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleMusic}
        aria-label={isPlaying ? "Senyapkan musik" : "Ketuk untuk nyalakan musik"}
        title={isPlaying ? "Senyapkan musik" : "Ketuk untuk nyalakan musik"}
        className={`flex h-11 items-center justify-center gap-2 rounded-full border border-primary/40 bg-card/90 text-primary shadow-lg backdrop-blur transition hover:bg-card ${
          isPlaying ? "w-11" : "px-3"
        }`}
      >
        {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        {!isPlaying && <span className="text-sm font-semibold">Nyalakan musik</span>}
      </button>
    </div>
  );
};

export default BackgroundMusic;
