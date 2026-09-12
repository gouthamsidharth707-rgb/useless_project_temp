"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import LobbyUI from "@/app/components/lobbyUI";
import { supabase } from "@/app/lib/client";

const getResultTitle = (score: number, isWinner: boolean) => {
  if (isWinner) {
    if (score > 250) return "THE EXCUSE ARCHITECT";
    if (score > 180) return "ALIBI SUPREME";
    if (score > 100) return "MASTER OF DEFLECTION";
    if (score > 50) return "CERTIFIED YAPPER";
    return "BARELY CONVINCING";
  }

  if (score > 180) return "THE STORY COLLAPSED";
  if (score > 100) return "ALIBI DENIED";
  if (score > 50) return "CAUGHT IN 4K";
  return "YOU'VE BEEN EXPOSED";
};

const getResultMessage = (score: number, isWinner: boolean) => {
  if (isWinner) {
    if (score > 250)
      return "That excuse had more plot twists than the original problem. Nobody knew what was happening, but somehow you won.";

    if (score > 180)
      return "You walked into an impossible situation and somehow walked out looking innocent. That is a dangerous level of confidence.";

    if (score > 100)
      return "You answered every accusation with another question until everyone forgot what they were accusing you of.";

    if (score > 50)
      return "Not the cleanest performance, but you said it with enough confidence to make everyone question their own memory.";

    return "You survived by the smallest possible margin. Technically, the excuse worked. We are not asking questions.";
  }

  if (score > 180)
    return "You had the confidence, the delivery and absolutely no evidence. Unfortunately, the story still fell apart.";

  if (score > 100)
    return "There was an excuse in there somewhere. Unfortunately, it disappeared before anyone could believe it.";

  if (score > 50)
    return "You almost sold it. Then one tiny detail walked into the room and ruined everything.";

  return "The excuse lasted about three seconds. Even you looked unconvinced by the end of it.";
};

const BACKGROUND_MUSIC_VOLUME = 0.40;
const ANNOUNCER_MUSIC_VOLUME = 0.00;
const ANNOUNCER_VOICE_RATE = 0.9;
const ANNOUNCER_VOICE_PITCH = 0.72;

const getPreferredAnnouncerVoice = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) =>
    /^en(-|_)/i.test(voice.lang)
  );

  const preferred = englishVoices.find((voice) =>
    /Google US English|Google UK English|Microsoft David|Microsoft Mark|Microsoft Guy|Microsoft Jenny|Microsoft Zira/i.test(voice.name)
  );

  return preferred || englishVoices[0] || voices[0] || null;
};

const speakText = (text: string, music: HTMLAudioElement | null, soundEnabled: boolean) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const normalMusicVolume = BACKGROUND_MUSIC_VOLUME;
  const wasMusicPlaying = !!music && !music.paused;

  // HARD STOP: pause the actual audio element instead of only setting volume to 0.
  // This guarantees that the background music cannot be heard while the AI speaks.
  if (music && wasMusicPlaying) {
    music.pause();
  }

  let restored = false;
  const restoreMusic = () => {
    if (restored) return;
    restored = true;

    if (music && soundEnabled && wasMusicPlaying) {
      music.volume = normalMusicVolume;
      void music.play().catch(() => {});
    }
  };

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = ANNOUNCER_VOICE_RATE;
  utterance.pitch = ANNOUNCER_VOICE_PITCH;
  utterance.volume = 1.0;

  const preferredVoice = getPreferredAnnouncerVoice();
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Stop again at the exact moment speech begins in case another effect started music
  // between the initial pause and SpeechSynthesis.onstart.
  utterance.onstart = () => {
    if (music) {
      music.pause();
    }
  };

  utterance.onend = restoreMusic;
  utterance.onerror = restoreMusic;

  window.speechSynthesis.speak(utterance);
};


/* =========================================================
   SCENARIOS
   ========================================================= */

const scenarios = [
  "You forgot your best friend's birthday and they have been waiting all day for you.",
  "You accidentally sent your private group chat messages to the entire college WhatsApp group.",
  "You were supposed to submit an important assignment yesterday, but you completely forgot about it.",
  "You borrowed your friend's expensive headphones and somehow returned only one side.",
  "You told everyone you knew how to drive, and now you've somehow ended up inside a stranger's garden.",
  "You were responsible for looking after your friend's pet for one day. The pet is now missing.",
  "You accidentally deleted 10 years of photos from your family's shared computer.",
  "You told your parents you were studying at the library. Someone just posted a video of you at a nightclub.",
  "You were supposed to attend an important wedding, but you arrived at the wrong wedding.",
  "You accidentally ordered 500 pizzas using your friend's credit card.",
  "You broke the principal's office window and there are security cameras everywhere.",
  "You were put in charge of organizing a surprise party. The surprise has somehow been ruined.",
  "You accidentally became the admin of a huge online group and somehow banned everyone.",
  "You woke up to discover that your face has become the profile picture of the entire college.",
  "You accidentally submitted your grocery list instead of your final-year project.",
  "You were asked to present your project in five minutes. You haven't even opened the project.",
  "You accidentally sent a voice note meant for your best friend to your professor.",
  "You somehow caused the college Wi-Fi to stop working for everyone.",
  "You promised to keep a secret. The secret is now trending online.",
  "You told someone you could cook. They have now asked you to prepare dinner for 20 people.",
  "You accidentally walked into the wrong classroom and gave a 10-minute presentation before realizing it.",
  "You were supposed to bring your passport to the airport. You brought your school ID instead.",
  "You borrowed someone's car for 10 minutes. The car is now inexplicably covered in birthday decorations.",
  "You accidentally challenged the wrong person to a boxing match and the match starts in one hour.",
  "You told everyone you could communicate with animals. Your friends have demanded a demonstration.",
  "You accidentally became responsible for a goat that is currently sitting in your bedroom.",
  "You somehow convinced an entire village that you are a professional magician.",
  "You woke up with absolutely no memory of agreeing to organize a wedding tomorrow.",
  "You accidentally deleted the entire company's database.",
  "You declared war on a small country and now everyone wants an explanation."
];


export default function GameRoom() {
  const router = useRouter();
  const { roomCode } = useParams();
  const searchParams = useSearchParams();

  const myName = searchParams.get("player");

  const reviewScrollRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [myPlayer, setMyPlayer] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);

  const [excuse, setExcuse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [aiComment, setAiComment] = useState("");
  const [aiCommentPlayer, setAiCommentPlayer] = useState("");
  const [aiCommentScore, setAiCommentScore] = useState(0);
  const [aiCommentVisible, setAiCommentVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [resultAnimation, setResultAnimation] = useState<"WIN" | "LOSE" | null>(null);
  const [finalWinnerId, setFinalWinnerId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const lastGameStatusRef = useRef<string | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const playersRef = useRef<any[]>([]);
  const myPlayerRef = useRef<any>(null);


  /* =========================================================
     AUDIO
     ========================================================= */

  const getAudioContext = () => {
    if (typeof window === "undefined" || !window.AudioContext) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }

    return audioContextRef.current;
  };

  const startBackgroundMusic = async () => {
    if (typeof window === "undefined" || !soundEnabled) return;

    try {
      if (!backgroundMusicRef.current) {
        const audio = new Audio("/bgmusic.mp3");
        audio.loop = true;
        audio.volume = BACKGROUND_MUSIC_VOLUME;
        audio.preload = "auto";
        backgroundMusicRef.current = audio;
      }

      if (backgroundMusicRef.current.paused) {
        await backgroundMusicRef.current.play();
      }
    } catch {
      // Browser autoplay restrictions are handled by the sound button/user interaction.
    }
  };

  const stopBackgroundMusic = () => {
    const audio = backgroundMusicRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  };

  const playWrongBuzzer = () => {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    void ctx.resume();

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(190, now);
    oscillator.frequency.exponentialRampToValueAtTime(65, now + 0.48);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.48, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.52);
  };

  const playVictorySound = () => {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    void ctx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.13;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = index === notes.length - 1 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.38, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(start);
      oscillator.stop(start + 0.44);
    });
  };

  const triggerAIComment = (
    playerName: string,
    score: number,
    announcerText: string
  ) => {
    const comment =
      announcerText?.trim() ||
      `${playerName} has submitted an excuse. The judges are watching.`;

    setAiCommentPlayer(playerName);
    setAiCommentScore(score);
    setAiComment(comment);
    setAiCommentVisible(true);

    if (soundEnabled) {
      speakText(comment, backgroundMusicRef.current, soundEnabled);
    }

    window.setTimeout(() => {
      setAiCommentVisible(false);
    }, 6500);
  };

  useEffect(() => {
    playersRef.current = players;
    myPlayerRef.current = myPlayer;
  }, [players, myPlayer]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
      stopBackgroundMusic();
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
      stopBackgroundMusic();
      return;
    }

    if (gameState?.status === "PLAYING") {
      void startBackgroundMusic();
    }
  }, [soundEnabled, gameState?.status]);

  useEffect(() => {
    if (!soundEnabled || gameState?.status !== "PLAYING") return;

    const handleFirstInteraction = () => {
      void startBackgroundMusic();
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, [soundEnabled, gameState?.status]);


  /* =========================================================
     FETCH GAME
     ========================================================= */

  useEffect(() => {
    if (!roomCode || !myName) return;

    const fetchGame = async () => {
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (!game) return;

      gameIdRef.current = game.id;
      setGameState(game);

      const { data: currentPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", game.id)
        .order("created_at", { ascending: true });

      if (currentPlayers) {
        setPlayers(currentPlayers);

        setMyPlayer(
          currentPlayers.find((p: any) => p.name === myName) || null
        );
      }

      const { data: history } = await supabase
        .from("responses")
        .select("*, players(name)")
        .eq("game_id", game.id)
        .order("created_at", { ascending: true });

      if (history) {
        setFeed(history);
      }
    };

    fetchGame();


    /* =========================================================
       REALTIME
       ========================================================= */

    const channel = supabase
      .channel("game_loop")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `code=eq.${roomCode}`,
        },
        (payload: any) => {
          setGameState(payload.new);
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        () => {
          fetchGame();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "responses",
        },
        async (payload: any) => {
          if (payload.new.game_id !== gameIdRef.current) return;

          const { data: sender } = await supabase
            .from("players")
            .select("name, game_id")
            .eq("id", payload.new.player_id)
            .single();

          if (!sender || sender.game_id !== gameIdRef.current) return;

          const newMsg = {
            ...payload.new,
            players: {
              name: sender?.name || "Unknown",
            },
          };

          setFeed((prev) => {
            if (prev.some((item) => item.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          triggerAIComment(
            sender?.name || "Player",
            Number(payload.new.ai_score || 0),
            String(
              payload.new.ai_announcer ||
                "That excuse has been entered into evidence."
            )
          );
        }
      )

      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myName]);


  /* =========================================================
     RESET HISTORY WHEN GAME STARTS
     ========================================================= */

  useEffect(() => {
    if (gameState?.status === "PLAYING") {
      setShowHistory(false);
    }
  }, [gameState?.status]);


  /* =========================================================
     START GAME
     ========================================================= */

  const startGame = async () => {
    if (!players.length || !gameState) return;

    if (soundEnabled) {
      await startBackgroundMusic();
    }

    setFinalWinnerId(null);
    setResultAnimation(null);

    if (gameState.status === "GAME_OVER") {
      await supabase
        .from("responses")
        .delete()
        .eq("game_id", gameState.id);

      await supabase
        .from("players")
        .update({ score: 0 })
        .eq("game_id", gameState.id);

      setFeed([]);
    }

    const randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    await supabase
      .from("games")
      .update({
        status: "PLAYING",
        current_turn_player_id: players[0].id,
        round_number: 1,
        scenario: randomScenario,
      })
      .eq("id", gameState.id);
  };


  /* =========================================================
     SUBMIT EXCUSE
     ========================================================= */

  const submitExcuse = async () => {
    if (!excuse.trim() || !myPlayer) return;

    setLoading(true);

    if (soundEnabled) {
      await startBackgroundMusic();
    }

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        body: JSON.stringify({
          scenario: gameState.scenario,
          excuse,
          playerName: myPlayer.name || myName || "Player",
        }),
      });

      const result = await res.json();


      /* Save response */

      await supabase.from("responses").insert({
        game_id: gameState.id,
        player_id: myPlayer.id,
        excuse_text: excuse,
        ai_score: result.score,
        ai_critique: result.critique,
        ai_announcer: result.announcer,
      });


      /* Update score */

      await supabase
        .from("players")
        .update({
          score: (myPlayer.score || 0) + result.score,
        })
        .eq("id", myPlayer.id);


      /* Find next player */

      const myIndex = players.findIndex(
        (p) => p.id === myPlayer.id
      );

      const nextPlayerIndex =
        (myIndex + 1) % players.length;


      /* =====================================================
         END OF ROUND
         ===================================================== */

      if (nextPlayerIndex === 0) {
        const nextRound = gameState.round_number + 1;


        /* GAME OVER */

        if (nextRound > 2) {
          await supabase
            .from("games")
            .update({
              status: "GAME_OVER",
            })
            .eq("id", gameState.id);
        }


        /* NEXT ROUND */

        else {
          const randomScenario =
            scenarios[
              Math.floor(Math.random() * scenarios.length)
            ];

          await supabase
            .from("games")
            .update({
              round_number: nextRound,
              current_turn_player_id: players[0].id,
              scenario: randomScenario,
            })
            .eq("id", gameState.id);
        }
      }


      /* =====================================================
         NEXT PLAYER
         ===================================================== */

      else {
        await supabase
          .from("games")
          .update({
            current_turn_player_id:
              players[nextPlayerIndex].id,
          })
          .eq("id", gameState.id);
      }

      setExcuse("");

    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     WIN / LOSE EFFECT
     ========================================================= */

  useEffect(() => {
    if (gameState?.status !== "GAME_OVER") {
      lastGameStatusRef.current = gameState?.status || null;
      setResultAnimation(null);
      return;
    }

    if (lastGameStatusRef.current === "GAME_OVER") return;

    lastGameStatusRef.current = "GAME_OVER";

    let cancelled = false;

    const playFinalResult = async () => {
      // Re-read scores from Supabase because the score update and
      // GAME_OVER realtime events can arrive in either order.
      let latestPlayers = playersRef.current;

      if (gameIdRef.current) {
        const { data: freshPlayers } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", gameIdRef.current)
          .order("created_at", { ascending: true });

        if (freshPlayers && freshPlayers.length > 0) {
          latestPlayers = freshPlayers;
          playersRef.current = freshPlayers;
          setPlayers(freshPlayers);

          const freshMe =
            freshPlayers.find((p: any) => p.id === myPlayerRef.current?.id) ||
            freshPlayers.find((p: any) => p.name === myName);

          if (freshMe) {
            myPlayerRef.current = freshMe;
            setMyPlayer(freshMe);
          }
        }
      }

      if (cancelled) return;

      const latestMe = myPlayerRef.current;
      if (!latestMe || latestPlayers.length === 0) return;

      const finalWinner = latestPlayers.reduce((prev, current) =>
        Number(prev.score || 0) >= Number(current.score || 0)
          ? prev
          : current
      );

      const won = finalWinner.id === latestMe.id;

      setFinalWinnerId(finalWinner.id);
      setResultAnimation(won ? "WIN" : "LOSE");

      if (soundEnabled) {
        if (won) {
          playVictorySound();
        } else {
          playWrongBuzzer();
        }
      }

      stopBackgroundMusic();

      window.setTimeout(() => {
        if (!cancelled) setResultAnimation(null);
      }, 5200);
    };

    const timer = window.setTimeout(() => {
      void playFinalResult();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [gameState?.status, soundEnabled, myName]);

  /* =========================================================
     LOADING
     ========================================================= */

  if (!gameState || !myPlayer) {
    return (
      <main className="min-h-screen bg-[#080f25] flex items-center justify-center text-white">
        <div className="text-lg font-bold tracking-widest animate-pulse">
          LOADING...
        </div>
      </main>
    );
  }


  /* =========================================================
     GAME VARIABLES
     ========================================================= */

  const currentPlayer = players.find(
    (p) => p.id === gameState.current_turn_player_id
  );

  const currentPlayerName =
    currentPlayer?.name || "Waiting...";

  const isMyTurn =
    gameState.current_turn_player_id === myPlayer.id;

  const isHost = myPlayer.is_host;


  const winner =
    players.length > 0
      ? players.reduce((prev, current) =>
          Number(prev.score || 0) >= Number(current.score || 0)
            ? prev
            : current
        )
      : null;

  // At GAME_OVER, use the winner captured after reading the final
  // player scores from Supabase. This prevents stale realtime state
  // from showing the wrong animation.
  const effectiveWinnerId =
    finalWinnerId || winner?.id || null;

  const isWinner =
    effectiveWinnerId === myPlayer.id;

  const sortedPlayers = [...players].sort(
    (a, b) => b.score - a.score
  );


  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#080f25] text-white relative font-sans">

      <audio
        ref={backgroundMusicRef}
        src="/bgmusic.mp3"
        loop
        preload="auto"
        className="hidden"
      />

      {/* Background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -top-32 -left-20 h-72 w-[620px] rounded-[50%] bg-[#18234e] opacity-70 blur-[1px]" />

        <div className="absolute top-[180px] -right-40 h-[430px] w-[430px] rounded-full bg-[#111b3e] opacity-80" />

        <div className="absolute bottom-[-160px] -left-40 h-[350px] w-[650px] rounded-[50%] bg-[#151e43]" />

        <div className="absolute bottom-[-220px] right-[-100px] h-[420px] w-[550px] rounded-[50%] bg-[#101a3b]" />

      </div>


      {/* =====================================================
          AI ANNOUNCER POPUP
         ===================================================== */}

      {aiCommentVisible && gameState.status === "PLAYING" && (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
          <div className="absolute left-1/2 top-8 w-[min(92vw,760px)] -translate-x-1/2 animate-[aiPop_0.45s_ease-out]">
            <div className="relative rounded-[28px] border-2 border-[#9b7cff] bg-[#101a3f]/95 px-7 py-5 text-center shadow-[0_20px_70px_rgba(89,76,227,0.45)] backdrop-blur-xl">
              <div className="absolute -left-10 -top-8 text-5xl animate-bounce">🎈</div>
              <div className="absolute -right-10 -top-7 text-5xl animate-bounce">🎈</div>
              <div className="absolute -left-9 bottom-0 text-4xl rotate-[-18deg]">📣</div>
              <div className="absolute -right-9 bottom-0 text-4xl rotate-[18deg]">📯</div>

              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9aaef0]">
                AI ANNOUNCER
              </div>

              <div className="mt-1 text-sm font-black uppercase tracking-widest text-[#58e5ae]">
                {aiCommentPlayer} · {aiCommentScore} POINTS
              </div>

              <p className="mt-3 text-lg font-black leading-relaxed text-white sm:text-xl">
                {aiComment}
              </p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-8 flex justify-center gap-5 text-4xl opacity-80">
            <span className="animate-bounce">🎈</span>
            <span className="animate-[bounce_0.8s_0.15s_infinite]">📯</span>
            <span className="animate-bounce">🎈</span>
          </div>
        </div>
      )}


      {/* =====================================================
          SOUND CONTROL
         ===================================================== */}

      {gameState.status === "PLAYING" && (
        <button
          type="button"
          onClick={async () => {
            if (soundEnabled) {
              setSoundEnabled(false);
              return;
            }

            setSoundEnabled(true);
            await startBackgroundMusic();
          }}
          className="fixed right-5 top-5 z-[70] rounded-full border border-[#3d4e8c] bg-[#101a3a]/90 px-4 py-2 text-xs font-black tracking-widest text-[#dce4ff] shadow-lg backdrop-blur-xl transition hover:scale-105"
          aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
        >
          {soundEnabled ? "SOUND ON" : "SOUND OFF"}
        </button>
      )}


      {/* =====================================================
          GAMEPLAY
         ===================================================== */}

      {gameState.status !== "GAME_OVER" && (

        <div
          className={`relative z-10 w-full ${
            gameState.status === "LOBBY"
              ? "min-h-screen overflow-y-auto overflow-x-hidden"
              : "min-h-screen overflow-x-hidden"
          }`}
        >
          <div
            className={`w-full ${
              gameState.status === "LOBBY"
                ? "min-h-screen max-w-none"
                : "mx-auto max-w-2xl max-h-[calc(100vh-10px)] overflow-y-auto"
            } ${
              gameState.status === "LOBBY"
                ? "rounded-none border-0 bg-transparent p-0 shadow-none"
                : "rounded-[34px] border border-[#34467f] bg-[#0e1734]/95 p-6 shadow-2xl backdrop-blur-xl"
            }`}
          >


            {/* HEADER */}

            {gameState.status !== "LOBBY" && (
              <div className="flex items-center justify-between border-b border-[#273661] pb-5">

              <div className="text-sm font-black tracking-[0.25em] text-[#8fa4ed]">

                {gameState.status === "LOBBY"
                  ? "LOBBY"
                  : `ROUND ${gameState.round_number}`}

              </div>


              <div className="flex gap-2">

                {players.map((p) => (

                  <div
                    key={p.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      p.id === gameState.current_turn_player_id
                        ? "border-[#7a6cff] bg-[#4a42a8] text-white"
                        : "border-[#34467f] bg-[#151f43] text-[#9eafea]"
                    }`}
                  >
                    {p.name}: {p.score}
                  </div>

                ))}

              </div>

              </div>
            )}


            {/* =================================================
                LOBBY
               ================================================= */}

            <div
              className={
                gameState.status === "LOBBY"
                  ? "min-h-screen w-full"
                  : "py-2 text-center"
              }
            >

              {gameState.status === "LOBBY" ? (

                <LobbyUI
                  roomCode={String(roomCode)}
                  players={players}
                  myPlayer={myPlayer}
                  isHost={isHost}
                  startGame={startGame}
                  onBack={() => router.push("/")}
                />

              ) : (

                /* =================================================
                   GAMEPLAY SCREEN
                   ================================================= */

                <>

                  {/* SCENARIO */}

                  <div className="rounded-3xl border border-[#35477d] bg-[#151f43] p-7">

                    <h3 className="mb-3 text-xs font-black tracking-[0.25em] text-[#7188d0]">
                      CURRENT SCENARIO
                    </h3>

                    <p className="text-xl font-bold leading-relaxed text-white">
                      "{gameState.scenario}"
                    </p>

                  </div>


                  {/* EXCUSE INPUT */}

                  <div className="relative mt-6">

                    <textarea
                      className="h-48 w-full resize-none rounded-3xl border border-[#394b84] bg-[#0b1430] p-6 text-lg text-white outline-none placeholder:text-[#526598] focus:border-[#6c5cff] focus:ring-4 focus:ring-[#5548d9]/20 disabled:opacity-50"
                      placeholder={
                        isMyTurn
                          ? "Type your excuse here..."
                          : `Wait, ${currentPlayerName} is lying...`
                      }
                      value={excuse}
                      onChange={(e) =>
                        setExcuse(e.target.value)
                      }
                      disabled={!isMyTurn || loading}
                    />


                    {isMyTurn && (

                      <button
                        onClick={submitExcuse}
                        disabled={loading}
                        className="absolute bottom-4 right-4 rounded-xl bg-gradient-to-r from-[#4cdb9d] to-[#3a9cff] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
                      >
                        {loading
                          ? "JUDGING..."
                          : "SUBMIT"}
                      </button>

                    )}

                  </div>


                  {/* TURN */}

                  <div className="mt-6">

                    <span className="rounded-full border border-[#3c9e77] bg-[#12372f] px-5 py-2 text-sm font-bold text-[#58e5ae]">

                      {isMyTurn
                        ? "YOUR TURN"
                        : `${currentPlayerName}'S TURN`}

                    </span>

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          WIN / LOSE ANIMATION
         ===================================================== */}

      {resultAnimation && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {resultAnimation === "WIN" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b3d2f]/30">
              <div className="relative animate-[victoryBurst_0.8s_ease-out] rounded-[36px] border-2 border-[#45e0a3] bg-[#102f2a]/95 px-12 py-9 text-center shadow-[0_0_100px_rgba(69,224,163,0.55)]">
                <div className="absolute -left-10 -top-10 text-5xl animate-bounce">🎈</div>
                <div className="absolute -right-10 -top-8 text-5xl animate-bounce">🎈</div>
                <div className="absolute -left-12 bottom-4 text-4xl rotate-[-20deg]">📯</div>
                <div className="absolute -right-12 bottom-4 text-4xl rotate-[20deg]">📯</div>
                <div className="text-7xl font-black tracking-tight text-[#5af0b0]">VICTORY!</div>
                <div className="mt-3 text-lg font-black uppercase tracking-[0.3em] text-white">YOU WON THE ROYALE</div>
                <div className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-[#8df4c7]">CHAMPION</div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#3b1020]/45 animate-[loserFlash_0.45s_ease-in-out_3]">
              <div className="relative animate-[loserShake_0.55s_ease-in-out_5] rounded-[36px] border-2 border-[#ff5d7d] bg-[#321526]/95 px-12 py-9 text-center shadow-[0_0_100px_rgba(255,70,110,0.55)]">
                <div className="absolute -left-12 -top-10 text-5xl rotate-[-18deg]">📯</div>
                <div className="absolute -right-12 -top-8 text-5xl rotate-[18deg]">📯</div>
                <div className="text-7xl font-black tracking-tight text-[#ff6b89]">BUSTED!</div>
                <div className="mt-3 text-lg font-black uppercase tracking-[0.3em] text-white">YOUR EXCUSE FAILED</div>
                <div className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-[#ff91a7]">BETTER LUCK NEXT TIME</div>
                <div className="mt-5 flex justify-center gap-7 text-5xl font-black text-[#ff5d7d]">
                  <span className="animate-bounce">X</span><span>!</span><span className="animate-bounce">X</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* =====================================================
          RESULT SCREEN
         ===================================================== */}

      {gameState.status === "GAME_OVER" && !showHistory && (

        <div className="relative z-10 min-h-screen px-5 pb-12">

          {isWinner && (
            <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden">
              {Array.from({ length: 90 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute top-[-20px] h-3 w-2 animate-[confettiFall_3.8s_linear_infinite] rounded-sm"
                  style={{
                    left: `${(i * 37) % 100}%`,
                    animationDelay: `${(i % 18) * 0.12}s`,
                    animationDuration: `${2.8 + (i % 12) * 0.12}s`,
                    transform: `rotate(${(i * 41) % 360}deg)`,
                    background: `hsl(${(i * 47) % 360} 90% 65%)`,
                  }}
                />
              ))}
            </div>
          )}


          {/* TOP NAVIGATION */}

          <div className="mx-auto flex w-full max-w-5xl items-center justify-between pt-8">

            <button
              onClick={() => router.push("/")}
              aria-label="Go back"
              className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3d4e8c] bg-[#172044]/80 text-5xl text-white shadow-lg transition hover:bg-[#202b55]"
            >
              <span className="-mt-1">‹</span>
            </button>


            <div className="flex items-center gap-3 rounded-full border border-[#3d4e8c] bg-[#101a3a]/90 px-5 py-3 text-sm font-bold text-[#dce4ff] shadow-lg">

              <span>Better luck</span>
              <span>next time</span>
              <span className="text-3xl leading-none">
                🔮
              </span>

            </div>

          </div>


          {/* RESULT */}

          <div className="mx-auto mt-8 w-full max-w-3xl text-center">


            {/* CHARACTER */}

            <div className="relative mx-auto h-[300px] w-[300px]">

              <div
                className={`absolute inset-3 rounded-full border-[8px] ${
                  isWinner
                    ? "border-[#45d89e] bg-[#173e3b]"
                    : "border-[#7261e8] bg-[#2d2353]"
                } shadow-[0_0_45px_rgba(73,220,165,0.18)] overflow-hidden`}
              >

                <img
                  src={
                    isWinner
                      ? "/boy-winner-avatar.png"
                      : "/boy-loser-avatar.png"
                  }
                  alt={
                    isWinner
                      ? "Winner avatar"
                      : "Loser avatar"
                  }
                  className="h-full w-full object-cover"
                />

              </div>


              {/* CROWN */}

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-[-5deg] text-7xl drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]">

                {isWinner ? "👑" : "♕"}

              </div>


              {/* DECORATIONS */}

              <span className="absolute left-[-25px] top-20 text-5xl">
                🟢
              </span>

              <span className="absolute right-[-20px] top-32 text-5xl">
                🟣
              </span>

            </div>


            {/* RESULT HEADING */}

            <h1 className="mt-7 text-7xl font-black tracking-[-0.05em] leading-none sm:text-8xl">

              <span className="text-white">
                YOU{" "}
              </span>

              <span
                className={
                  isWinner
                    ? "bg-gradient-to-r from-white via-[#a7f3cf] to-[#39dc99] bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-[#b88cff] to-[#744de8] bg-clip-text text-transparent"
                }
              >
                {isWinner ? "WON!" : "LOST!"}
              </span>

            </h1>


            {/* MESSAGE */}

            <p className="mx-auto mt-6 max-w-2xl text-xl font-black uppercase tracking-[0.06em] leading-relaxed text-[#9aaef0] sm:text-2xl">

              {isWinner
                ? "YOUR YAPPING SKILLS HIT DIFFERENT!"
                : "OH NO! YOUR YAPPING SKILLS ARE NOT GOOD ENOUGH!"}

            </p>


            <p className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-[#9aaef0]">

              {isWinner ? "WELL PLAYED!" : ""}

            </p>


            {/* RESULT CARD */}

            <section className="mt-10 rounded-[34px] border border-[#35477d] bg-[#0d1735]/90 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)]">

              <div className="text-sm font-black uppercase tracking-[0.3em] text-[#8398df]">

                {isWinner
                  ? "YOUR FINAL SCORE"
                  : "YOUR OFFICIAL TITLE"}

              </div>


              {isWinner ? (

                <>

                  <div className="mt-5 flex items-center justify-center gap-7 rounded-[30px] border border-[#394a83] bg-[#151f43] py-6 shadow-inner">

                    <span className="text-6xl">
                      🏆
                    </span>

                    <span className="text-7xl font-black bg-gradient-to-r from-[#f5ffff] via-[#a7f3cf] to-[#39dc99] bg-clip-text text-transparent">

                      {myPlayer.score}

                    </span>

                  </div>


                  <div className="mt-7 rounded-[28px] border border-[#334579] bg-[#111b3d] p-7">

                    <div className="text-sm font-black uppercase tracking-[0.25em] text-[#8398df]">
                      YOUR VERDICT
                    </div>


                    <div className="mt-5 flex items-center justify-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#38498a] text-2xl">
                        ▤
                      </div>

                      <h2 className="text-2xl font-black text-[#42e0a0]">

                        {getResultTitle(myPlayer.score, isWinner)}

                      </h2>

                    </div>


                    <p className="mx-auto mt-5 max-w-xl text-lg font-semibold leading-relaxed text-[#9badE8]">

                      {getResultMessage(myPlayer.score, isWinner)}

                    </p>

                  </div>

                </>

              ) : (

                <div className="mt-5 rounded-[30px] border border-[#394a83] bg-[#151f43] px-5 py-7">

                  <div className="text-5xl font-black bg-gradient-to-r from-[#e084ff] to-[#8059ef] bg-clip-text text-transparent">

                    {getResultTitle(myPlayer.score, isWinner)}

                  </div>


                  <p className="mx-auto mt-7 max-w-xl text-lg font-semibold leading-relaxed text-[#a1b0e8]">

                    {getResultMessage(myPlayer.score, isWinner)}

                  </p>

                </div>

              )}

            </section>


            {/* SCROLL BUTTON */}

            <button
              onClick={() => {
                setShowHistory(true);

                setTimeout(() => {
                  reviewScrollRef.current?.scrollTo({
                    top: 9999,
                    behavior: "smooth",
                  });
                }, 100);
              }}
              className={`mt-8 flex w-full items-center justify-center gap-5 rounded-full border py-6 text-xl font-black tracking-wide text-white shadow-[0_12px_35px_rgba(30,220,160,0.18)] transition hover:scale-[1.01] active:scale-[0.99] ${
                isWinner
                  ? "border-[#54e3a8] bg-gradient-to-r from-[#3ed99d] to-[#17a875]"
                  : "border-[#826dff] bg-gradient-to-r from-[#7c63ff] to-[#5142dc]"
              }`}
            >

              <span className="text-3xl">
                ▤
              </span>

              <span>
                VIEW THE SCROLL OF TRUTH
              </span>

              <span className="text-4xl">
                →
              </span>

            </button>

          </div>

        </div>

      )}


      {/* =====================================================
          SCROLL OF TRUTH
         ===================================================== */}

      {gameState.status === "GAME_OVER" && showHistory && (

        <div className="relative z-10 min-h-screen px-5 py-8">

          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col rounded-[34px] border border-[#35477d] bg-[#0d1735]/95 p-5 shadow-2xl backdrop-blur-xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#293a6b] px-3 pb-5">

              <button
                onClick={() => setShowHistory(false)}
                className="text-3xl text-[#9eb1ed]"
              >
                ←
              </button>

              <h2 className="text-xl font-black uppercase tracking-[0.18em] text-[#b8c6f7]">
                THE SCROLL OF TRUTH
              </h2>

              <div className="w-8" />

            </div>


            {/* FEED */}

            <div
              ref={reviewScrollRef}
              className="flex-1 space-y-6 overflow-y-auto px-2 py-6"
            >

              {feed.map((msg: any) => {

                const isMine =
                  msg.players?.name === myName;

                return (

                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMine
                        ? "items-end"
                        : "items-start"
                    }`}
                  >

                    <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#7087ce]">
                      {msg.players?.name || "Unknown"}
                    </div>


                    <div
                      className={`max-w-[90%] rounded-3xl p-5 shadow-lg ${
                        isMine
                          ? "rounded-tr-none bg-gradient-to-br from-[#594ce3] to-[#3d83d8] text-white"
                          : "rounded-tl-none border border-[#334577] bg-[#151f43] text-[#dce4ff]"
                      }`}
                    >

                      <div className="text-base font-semibold leading-relaxed">
                        "{msg.excuse_text}"
                      </div>


                      <div
                        className={`mt-4 border-t pt-3 text-xs ${
                          isMine
                            ? "border-white/20"
                            : "border-[#30416e]"
                        }`}
                      >

                        <span className="mr-2 rounded-full bg-black/15 px-2 py-1 font-black">
                          Score: {msg.ai_score}
                        </span>

                        <span className="italic opacity-80">
                          "{msg.ai_critique}"
                        </span>

                      </div>

                    </div>

                  </div>

                );
              })}


              {/* FINAL RESULTS */}

              <div className="mt-10 rounded-3xl border border-[#35477d] bg-[#111b3d] p-6">

                <div className="text-center">

                  <div className="text-5xl">
                    🏆
                  </div>

                  <h3 className="mt-3 text-2xl font-black text-white">
                    FINAL RESULTS
                  </h3>

                </div>


                <div className="mt-6 space-y-3">

                  {sortedPlayers.map((p, i) => (

                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-[#334574] bg-[#172144] p-4"
                    >

                      <div>

                        <div className="text-[10px] font-black uppercase tracking-widest text-[#7087ce]">
                          {i === 0
                            ? "WINNER"
                            : "RUNNER UP"}
                        </div>

                        <div className="mt-1 font-black text-white">
                          {p.name}
                        </div>

                      </div>


                      <div className="text-right">

                        <div className="text-[10px] font-black uppercase tracking-widest text-[#7087ce]">
                          TITLE
                        </div>

                        <div className="mt-1 rounded-lg bg-[#252f62] px-3 py-1 text-xs font-black text-[#a9b9f2]">
                          {getResultTitle(p.score, i === 0)}
                        </div>

                      </div>


                      <div className="text-2xl font-black text-[#758bd1]">
                        {p.score}
                      </div>

                    </div>

                  ))}

                </div>


                {/* BUTTONS */}

                <div className="mt-7 flex gap-3">

                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 rounded-xl border border-[#40518b] bg-[#151f43] py-3 font-bold text-[#a6b6ec] hover:bg-[#1d294f]"
                  >
                    EXIT
                  </button>


                  {isHost && (

                    <button
                      onClick={startGame}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#36d79a] to-[#1cae78] py-3 font-black text-white shadow-[0_4px_0_#087b53] active:translate-y-1 active:shadow-none"
                    >
                      PLAY AGAIN
                    </button>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(40px, 110vh, 0) rotate(720deg);
            opacity: 0.95;
          }
        }

        @keyframes victoryBurst {
          0% {
            transform: scale(0.35) rotate(-5deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.08) rotate(1deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes loserShake {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          15% {
            transform: translateX(-14px) rotate(-1deg);
          }
          30% {
            transform: translateX(14px) rotate(1deg);
          }
          45% {
            transform: translateX(-10px) rotate(-1deg);
          }
          60% {
            transform: translateX(10px) rotate(1deg);
          }
          75% {
            transform: translateX(-5px);
          }
        }

        @keyframes loserFlash {
          0%, 100% {
            opacity: 0;
          }
          25%, 65% {
            opacity: 1;
          }
        }

        @keyframes aiPop {
          0% {
            transform: translateY(-35px) scale(0.75) rotate(-2deg);
            opacity: 0;
          }
          70% {
            transform: translateY(5px) scale(1.04) rotate(0.5deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}