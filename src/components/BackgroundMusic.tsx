import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicAsset from "@/assets/luka-negara.mp3.asset.json";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const audio = new Audio(musicAsset.url);
    audio.loop = true;
    audio.volume = 0.5;
    audio.muted = true; // mulai muted supaya autoplay diizinkan browser
    audio.autoplay = true;
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audioRef.current = audio;

    const startPlay = () => {
      audio.play().catch(() => {});
    };
    startPlay();

    const unmute = () => {
      audio.muted = false;
      setMuted(false);
      if (audio.paused) audio.play().catch(() => {});
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
      window.addEventListener(ev, unmute, { once: true, passive: true })
    );

    return () => {
      removeListeners();
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
    if (audio.paused) audio.play().catch(() => {});
  };

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Nyalakan musik" : "Senyapkan musik"}
      className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-card/80 text-primary shadow-lg backdrop-blur transition hover:bg-card"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
};

export default BackgroundMusic;
