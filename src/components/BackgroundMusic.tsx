import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicAsset from "@/assets/luka-negara.mp3.asset.json";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUnlockedRef = useRef(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.6;
    audio.muted = true;
    audio.play().catch(() => {});

    const unmute = () => {
      if (hasUnlockedRef.current) return;
      hasUnlockedRef.current = true;
      audio.muted = false;
      audio.volume = 0.6;
      const p = audio.play();
      if (p && typeof p.then === "function") p.catch(() => {});
      setMuted(false);
      removeListeners();
    };

    const events: (keyof WindowEventMap)[] = [
      "click",
      "touchstart",
      "touchend",
      "pointerdown",
      "keydown",
      "scroll",
      "wheel",
    ];
    const removeListeners = () => {
      events.forEach((ev) => window.removeEventListener(ev, unmute));
    };
    events.forEach((ev) =>
      window.addEventListener(ev, unmute, { passive: true })
    );

    return () => {
      removeListeners();
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!hasUnlockedRef.current) {
      hasUnlockedRef.current = true;
      audio.muted = false;
      audio.volume = 0.6;
      setMuted(false);
      audio.play().catch(() => {});
      return;
    }
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
    if (!next) {
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={musicAsset.url}
        loop
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        className="hidden"
      />
      <button
        onClick={toggleMute}
        aria-label={muted ? "Ketuk untuk nyalakan musik" : "Senyapkan musik"}
        title={muted ? "Ketuk untuk nyalakan musik" : "Senyapkan musik"}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-card/80 text-primary shadow-lg backdrop-blur transition hover:bg-card"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </>
  );
};

export default BackgroundMusic;
