"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/client";

export default function Lobby() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"MENU" | "JOIN">("MENU");

  // Create a new game room
  const createGame = async () => {
    if (!name.trim()) {
      alert("Enter your name first.");
      return;
    }

    setLoading(true);

    const newCode = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          code: newCode,
          status: "LOBBY",
        },
      ])
      .select()
      .single();

    if (gameError) {
      console.error(gameError);
      alert("Could not create the room. Try again.");
      setLoading(false);
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .insert([
        {
          game_id: game.id,
          name: name.trim(),
          is_host: true,
        },
      ]);

    if (playerError) {
      console.error(playerError);
      alert("Could not join the room.");
      setLoading(false);
      return;
    }

    router.push(
      `/game/${newCode}?player=${encodeURIComponent(name.trim())}`
    );
  };

  // Join an existing room
  const joinGame = async () => {
    if (!name.trim() || !roomCode.trim()) {
      alert("Enter your name and room code.");
      return;
    }

    setLoading(true);

    const cleanCode = roomCode.trim().toUpperCase();

    const { data: game, error } = await supabase
      .from("games")
      .select("id")
      .eq("code", cleanCode)
      .single();

    if (error || !game) {
      setLoading(false);
      alert("Room not found. Check the room code.");
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .insert([
        {
          game_id: game.id,
          name: name.trim(),
          is_host: false,
        },
      ]);

    if (playerError) {
      console.error(playerError);
      setLoading(false);
      alert("Could not join the room.");
      return;
    }

    router.push(
      `/game/${cleanCode}?player=${encodeURIComponent(name.trim())}`
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080F25] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute -left-40 -top-48 h-[620px] w-[760px] rounded-full bg-[#17234d] opacity-80" />

      <div className="absolute -right-60 top-[25%] h-[600px] w-[600px] rounded-full bg-[#111c42]" />

      <div className="absolute -bottom-64 -left-40 h-[600px] w-[750px] rounded-full bg-[#151f49]" />

      <div className="absolute -bottom-64 -right-40 h-[600px] w-[650px] rounded-full bg-[#111a3d]" />

      {/* Floating decorations */}

      <div className="absolute left-[8%] top-[34%] h-5 w-5 rotate-45 rounded-md bg-[#7655F5] opacity-70" />

      <div className="absolute right-[13%] top-[20%] h-4 w-4 rounded-full bg-[#3DDEA0] opacity-80" />

      <div className="absolute bottom-[23%] left-[17%] h-3 w-3 rounded-full bg-[#A66BFF] opacity-70" />

      <div className="absolute bottom-[17%] right-[19%] h-6 w-6 rotate-12 rounded-lg bg-[#4C8DFF] opacity-60" />


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-12">

        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">


          {/* =================================================
              LEFT SIDE
          ================================================== */}

          <section className="relative z-20 text-center lg:text-left">

            {/* LOGO IMAGE */}

            <div className="mb-7 flex justify-center lg:justify-start">

              <img
                src="/excuse-royale-logo.png"
                alt="Excuse Royale - The Battle of Pointless Excuses"
                className="w-[330px] object-contain sm:w-[400px] lg:w-[460px]"
              />

            </div>


            {/* TAGLINE */}

            <div className="max-w-xl">

              <h2 className="text-4xl font-black leading-[1.05] sm:text-5xl">

                Make excuses.

                <br />

                <span className="bg-gradient-to-r from-[#A66BFF] via-[#8D70FF] to-[#4C8DFF] bg-clip-text text-transparent">
                  Get away with anything.
                </span>

              </h2>

              <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#91A5E6]">
                Two players. Ridiculous situations. One chance to invent the
                most convincing excuse possible.
              </p>

            </div>


            {/* =================================================
                INPUTS
            ================================================== */}

            <div className="mt-8 w-full max-w-md">

              {/* NAME */}

              <label className="mb-2 ml-1 block text-left text-xs font-black uppercase tracking-[0.2em] text-[#91A5E6]">
                Your nickname
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Enter your name..."
                className="w-full rounded-2xl border border-[#304477] bg-[#111C3D]/95 px-5 py-4 text-lg font-bold text-white outline-none transition placeholder:text-[#53699f] focus:border-[#7655F5] focus:ring-4 focus:ring-[#7655F5]/10 disabled:opacity-50"
              />


              {/* =================================================
                  MAIN MENU
              ================================================== */}

              {mode === "MENU" && (

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <button
                    onClick={createGame}
                    disabled={loading}
                    className="rounded-2xl bg-gradient-to-r from-[#7655F5] to-[#A66BFF] px-6 py-4 text-base font-black text-white shadow-[0_7px_0_#4934a5] transition hover:brightness-110 active:translate-y-[6px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "CREATING..." : "CREATE ROOM"}
                  </button>


                  <button
                    onClick={() => setMode("JOIN")}
                    disabled={loading}
                    className="rounded-2xl border border-[#354b80] bg-[#111C3D]/95 px-6 py-4 text-base font-black text-white transition hover:border-[#7655F5] hover:bg-[#17244A] disabled:opacity-60"
                  >
                    JOIN ROOM
                  </button>

                </div>

              )}


              {/* =================================================
                  JOIN ROOM
              ================================================== */}

              {mode === "JOIN" && (

                <div className="mt-4">

                  <label className="mb-2 ml-1 block text-left text-xs font-black uppercase tracking-[0.2em] text-[#91A5E6]">
                    Room code
                  </label>

                  <input
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(e.target.value.toUpperCase())
                    }
                    disabled={loading}
                    maxLength={4}
                    placeholder="ABCD"
                    className="w-full rounded-2xl border border-[#7655F5] bg-[#111C3D] px-5 py-4 text-center text-2xl font-black tracking-[0.4em] text-white outline-none placeholder:text-[#53699f]"
                  />


                  <button
                    onClick={joinGame}
                    disabled={loading}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#7655F5] to-[#4C8DFF] px-6 py-4 text-base font-black text-white shadow-[0_7px_0_#3d52a8] transition hover:brightness-110 active:translate-y-[6px] active:shadow-none disabled:opacity-60"
                  >
                    {loading ? "JOINING..." : "ENTER ROOM →"}
                  </button>


                  <button
                    onClick={() => setMode("MENU")}
                    disabled={loading}
                    className="mt-4 text-sm font-bold text-[#91A5E6] transition hover:text-white"
                  >
                    ← Back
                  </button>

                </div>

              )}

            </div>

          </section>


          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <section className="relative flex min-h-[600px] items-center justify-center lg:min-h-[700px]">

            {/* Character glow */}

            <div className="absolute top-[25%] h-[420px] w-[420px] rounded-full bg-[#7655F5]/20 blur-[110px]" />


            {/* =================================================
                CHARACTER
            ================================================== */}

            <img
              src="/intro-character.png"
              alt="Excuse Royale host"
              className="relative z-10 h-[580px] w-auto max-w-none object-contain drop-shadow-[0_25px_50px_rgba(118,85,245,0.35)] sm:h-[650px] lg:h-[720px]"
            />


            {/* =================================================
                SPEECH BUBBLE
            ================================================== */}

            <div className="absolute right-[0%] top-[8%] z-30 w-[230px] rounded-3xl border border-[#3b4f85] bg-[#111C3D] px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">

              <p className="text-sm font-black leading-6 text-white">
                Ready to make some pointless excuses?
              </p>

              {/* Bubble tail */}

              <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b border-r border-[#3b4f85] bg-[#111C3D]" />

            </div>


            {/* Small decorative dots */}

            <div className="absolute left-[8%] top-[40%] z-20 h-9 w-9 rounded-full bg-[#3DDEA0] shadow-[0_0_25px_rgba(61,222,160,0.35)]" />

            <div className="absolute right-[4%] top-[48%] z-20 h-7 w-7 rounded-full bg-[#A66BFF] shadow-[0_0_25px_rgba(166,107,255,0.35)]" />

            <div className="absolute bottom-[12%] left-[15%] z-20 h-5 w-5 rounded-full bg-[#4C8DFF]" />

          </section>

        </div>

      </div>

    </main>
  );
}