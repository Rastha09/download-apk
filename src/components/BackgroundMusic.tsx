import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicAsset from "@/assets/luka-negara.mp3.asset.json";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(true);

  const startMusic = useCallback(async (force = false) => {
    if (userPausedRef.current && !force) return;

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(musicAsset.url);
      audio.loop = true;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.style.display = "none";
      document.body.appendChild(audio);
      audioRef.current = audio;
    }

    audio.muted = false;
    audio.volume = 0.6;

    try {
      await audio.play();
      setIsPlaying(true);
      setNeedsUnlock(false);
    } catch {
      setIsPlaying(false);
      setNeedsUnlock(true);
    }
  }, []);

  useEffect(() => {
    if (isPlaying || userPausedRef.current) return;

    const unlock = () => {
      void startMusic();
    };
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "pointerup", "touchstart", "touchend", "click", "keydown"];
    const options: AddEventListenerOptions = { capture: true, passive: true };

    events.forEach((eventName) => document.addEventListener(eventName, unlock, options));

    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, unlock, options));
    };
  }, [isPlaying, startMusic]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      audio?.pause();
      audio?.remove();
    };
  }, []);

  const requestMusic = (event: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    userPausedRef.current = false;
    void startMusic(true);
  };

  const toggleMusic = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      userPausedRef.current = false;
      void startMusic(true);
      return;
    }

    userPausedRef.current = true;
    audio.pause();
    setIsPlaying(false);
    setNeedsUnlock(false);
  };

  return (
    <>
      {needsUnlock && !isPlaying && (
        <button
          type="button"
          onPointerDown={requestMusic}
          onTouchStart={requestMusic}
          onMouseDown={requestMusic}
          onClick={requestMusic}
          aria-label="Ketuk layar untuk nyalakan musik"
          className="fixed inset-0 z-[2147483646] flex touch-manipulation select-none items-end justify-center bg-transparent p-4 pb-20"
        >
          <span className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-primary/40 bg-card/95 px-5 text-sm font-semibold text-primary shadow-lg backdrop-blur">
            <VolumeX className="h-5 w-5" />
            Ketuk untuk mulai musik
          </span>
        </button>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[2147483647] flex justify-center px-4">
      <button
        type="button"
        onPointerDown={isPlaying ? toggleMusic : requestMusic}
        onTouchStart={isPlaying ? toggleMusic : requestMusic}
        onMouseDown={isPlaying ? toggleMusic : requestMusic}
        onClick={toggleMusic}
        aria-label={isPlaying ? "Senyapkan musik" : "Ketuk untuk nyalakan musik"}
        title={isPlaying ? "Senyapkan musik" : "Ketuk untuk nyalakan musik"}
        className={`pointer-events-auto flex min-h-12 touch-manipulation select-none items-center justify-center gap-2 rounded-full border border-primary/40 bg-card/95 text-primary shadow-lg backdrop-blur transition hover:bg-card ${
          isPlaying ? "w-11" : "px-3"
        }`}
      >
        {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        {!isPlaying && <span className="text-sm font-semibold">Nyalakan musik</span>}
      </button>
      </div>
    </>
  );
};

export default BackgroundMusic;
