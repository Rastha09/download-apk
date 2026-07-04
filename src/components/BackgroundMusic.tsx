import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicAsset from "@/assets/luka-negara.mp3.asset.json";

const MUSIC_URL = musicAsset.url.startsWith("http")
  ? musicAsset.url
  : `https://download-apk.lovable.app${musicAsset.url}`;

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAttemptRef = useRef<Promise<boolean> | null>(null);
  const [muted, setMuted] = useState(true);

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio(MUSIC_URL);
    audio.volume = 0.6;
    audio.loop = true;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audio.style.display = "none";
    document.body.appendChild(audio);
    audioRef.current = audio;

    return audio;
  }, []);

  const startMusic = useCallback(() => {
    if (playAttemptRef.current) return playAttemptRef.current;

    const audio = getAudio();
    audio.muted = false;
    audio.volume = 0.6;

    const playPromise = audio
      .play()
      .then(() => {
        setMuted(false);
        return true;
      })
      .catch(() => {
        audio.muted = true;
        setMuted(true);
        return false;
      })
      .finally(() => {
        playAttemptRef.current = null;
      });

    playAttemptRef.current = playPromise;
    return playPromise;
  }, [getAudio]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ["pointerdown", "touchend", "click", "keydown"];

    let removeListeners = () => {};

    const startFromGesture = (event: Event) => {
      if ((event.target as Element | null)?.closest('[data-music-control="true"]')) return;

      void startMusic().then((success) => {
        if (success) removeListeners();
      });
    };

    removeListeners = () => {
      events.forEach((ev) => window.removeEventListener(ev, startFromGesture, true));
    };

    events.forEach((ev) => window.addEventListener(ev, startFromGesture, { capture: true, passive: true }));

    const wasUnmutedBeforeDuck = { current: false };
    const handleDuck = () => {
      const audio = audioRef.current;
      if (!audio) return;
      wasUnmutedBeforeDuck.current = !audio.muted && !audio.paused;
      audio.muted = true;
      setMuted(true);
    };
    const handleUnduck = () => {
      const audio = audioRef.current;
      if (!audio || !wasUnmutedBeforeDuck.current) return;
      audio.muted = false;
      audio.volume = 0.6;
      void audio.play().then(() => setMuted(false)).catch(() => {});
    };
    window.addEventListener("bgm:duck", handleDuck);
    window.addEventListener("bgm:unduck", handleUnduck);

    return () => {
      removeListeners();
      window.removeEventListener("bgm:duck", handleDuck);
      window.removeEventListener("bgm:unduck", handleUnduck);
      audioRef.current?.pause();
      audioRef.current?.remove();
      audioRef.current = null;
    };
  }, [startMusic]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      void startMusic();
      return;
    }
    if (muted || audio.paused) {
      audio.muted = false;
      audio.volume = 0.6;
      void audio.play().then(() => setMuted(false)).catch(() => void startMusic());
      return;
    }
    audio.muted = true;
    setMuted(true);
  };

  return (
    <>
      <button
        data-music-control="true"
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
