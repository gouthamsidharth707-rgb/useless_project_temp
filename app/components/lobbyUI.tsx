"use client";

type Player = {
  id: string;
  name: string;
  is_host: boolean;
  score?: number;
};

type LobbyUIProps = {
  roomCode: string;
  players: Player[];
  myPlayer: Player | null;
  isHost: boolean;
  startGame: () => void;
  onBack: () => void;
};

export default function LobbyUI({
  roomCode,
  players,
  myPlayer,
  isHost,
  startGame,
  onBack,
}: LobbyUIProps) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#080F25] text-white">

      {/* Background shapes */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-32 -top-40 h-[500px] w-[700px] rounded-full bg-[#17234D]" />

        <div className="absolute -right-48 top-[28%] h-[500px] w-[500px] rounded-full bg-[#111C42]" />

        <div className="absolute -bottom-52 -left-40 h-[520px] w-[720px] rounded-full bg-[#151F49]" />

        <div className="absolute -bottom-64 -right-40 h-[550px] w-[650px] rounded-full bg-[#101A3B]" />

      </div>


      {/* Decorative dots */}

      <div className="pointer-events-none fixed left-[7%] top-[18%] h-5 w-5 rotate-45 rounded-md bg-[#7655F5] opacity-70" />

      <div className="pointer-events-none fixed right-[12%] top-[22%] h-5 w-5 rounded-full bg-[#3DDEA0] opacity-80" />

      <div className="pointer-events-none fixed bottom-[18%] left-[15%] h-4 w-4 rounded-full bg-[#4C8DFF] opacity-70" />

      <div className="pointer-events-none fixed bottom-[24%] right-[18%] h-6 w-6 rounded-lg bg-[#A66BFF] opacity-70" />


      {/* Main */}

      <div className="relative z-10 min-h-screen px-5 py-6 sm:px-8 lg:px-12">

        {/* Top bar */}

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">

          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#35497F] bg-[#111C3D]/80 text-3xl text-white transition hover:bg-[#1A2852]"
          >
            ‹
          </button>

          <div className="flex items-center gap-3 rounded-full border border-[#35497F] bg-[#111C3D]/80 px-4 py-2">

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8298DE]">
              ROOM
            </span>

            <span className="rounded-lg bg-[#1B2852] px-3 py-1 text-sm font-black tracking-[0.2em] text-white">
              {roomCode}
            </span>

          </div>

        </div>


        {/* Lobby content */}

        <div className="mx-auto grid min-h-[calc(100vh-110px)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">


          {/* LEFT */}

          <section className="relative z-20">

            {/* Logo */}

            <div className="mb-7">

              <img
                src="/excuse-royale-logo.png"
                alt="Excuse Royale"
                className="w-[250px] object-contain sm:w-[300px]"
              />

            </div>


            {/* Heading */}

            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#8399DF]">
              GAME LOBBY
            </p>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl">

              Assemble your
              <br />

              <span className="bg-gradient-to-r from-[#A66BFF] to-[#4C8DFF] bg-clip-text text-transparent">
                excuse squad.
              </span>

            </h1>

            <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#8FA5E5]">
              Grab your opponent, prepare your worst excuses and get ready
              to defend the completely indefensible.
            </p>


            {/* Room code */}

            <div className="mt-7 max-w-md rounded-3xl border border-[#35497F] bg-[#101A3A]/90 p-5">

              <div className="text-xs font-black uppercase tracking-[0.25em] text-[#8399DF]">
                ROOM CODE
              </div>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-4xl font-black tracking-[0.25em] text-white">
                  {roomCode}
                </span>

                <span className="rounded-full bg-[#182652] px-4 py-2 text-xs font-bold text-[#91A6E7]">
                  SHARE THIS
                </span>

              </div>

            </div>


            {/* Players */}

            <div className="mt-6 max-w-md">

              <div className="mb-3 flex items-center justify-between">

                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#8399DF]">
                  PLAYERS
                </span>

                <span className="text-xs font-bold text-[#6379B7]">
                  {players.length}/2
                </span>

              </div>


              <div className="grid gap-3 sm:grid-cols-2">

                {players.map((player, index) => (

                  <div
                    key={player.id}
                    className={`rounded-2xl border p-4 ${
                      player.id === myPlayer?.id
                        ? "border-[#7655F5] bg-[#1A2450]"
                        : "border-[#35497F] bg-[#111C3D]"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${
                          index === 0
                            ? "bg-[#7655F5]"
                            : "bg-[#3DDEA0] text-[#07172A]"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>

                        <div className="font-black text-white">
                          {player.name}
                        </div>

                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#7086C7]">
                          {player.is_host ? "HOST" : "PLAYER"}
                        </div>

                      </div>

                    </div>

                  </div>

                ))}


                {/* Empty slot */}

                {players.length < 2 && (

                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#35497F] bg-[#0D1733]/60 p-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18244A] text-xl text-[#667CB8]">
                      +
                    </div>

                    <div>

                      <div className="font-bold text-[#7D91CF]">
                        Waiting...
                      </div>

                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#53699F]">
                        PLAYER 2
                      </div>

                    </div>

                  </div>

                )}

              </div>

            </div>


            {/* Start button */}

            <div className="mt-7 max-w-md">

              {isHost && players.length >= 2 ? (

                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#3DDEA0] to-[#27B985] py-4 text-lg font-black text-[#061B19] shadow-[0_7px_0_#087B53] transition hover:brightness-110 active:translate-y-[6px] active:shadow-none"
                >
                  START THE ROYALE →
                </button>

              ) : (

                <div className="rounded-2xl border border-[#35497F] bg-[#111C3D]/80 px-5 py-4 text-center">

                  <p className="text-sm font-black text-[#91A6E7]">
                    {players.length < 2
                      ? "Waiting for your opponent..."
                      : "Waiting for the host to start..."}
                  </p>

                </div>

              )}

            </div>

          </section>


          {/* RIGHT: CHARACTER */}

          <section className="relative flex min-h-[600px] items-center justify-center">


            {/* Glow */}

            <div className="absolute top-[30%] h-[430px] w-[430px] rounded-full bg-[#7655F5]/20 blur-[110px]" />


            {/* Speech bubble */}

            <div className="absolute right-[3%] top-[8%] z-30 w-[230px] rounded-3xl border border-[#3B4F85] bg-[#111C3D] px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">

              <p className="text-sm font-black leading-6 text-white">
                Your opponent is coming.
                <br />
                Try to look innocent.
              </p>

              <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b border-r border-[#3B4F85] bg-[#111C3D]" />

            </div>


            {/* FULL BODY CHARACTER */}

            <img
              src="/page2-char.png"
              alt="Excuse Royale host"
              className="relative z-10 h-[480px] w-auto object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.45)] sm:h-[550px] lg:h-[620px]"
            />


            {/* Character label */}

            <div className="absolute bottom-[3%] z-20 rounded-full border border-[#35497F] bg-[#111C3D]/95 px-6 py-3 shadow-xl">

              <span className="text-xs font-black uppercase tracking-[0.22em] text-[#9AAEEB]">
                THE ROYALE HOST
              </span>

            </div>


            {/* Decorative circles */}

            <div className="absolute left-[8%] top-[38%] z-20 h-9 w-9 rounded-full bg-[#3DDEA0] shadow-[0_0_25px_rgba(61,222,160,0.35)]" />

            <div className="absolute right-[5%] top-[48%] z-20 h-7 w-7 rounded-full bg-[#A66BFF] shadow-[0_0_25px_rgba(166,107,255,0.35)]" />

            <div className="absolute bottom-[15%] left-[17%] z-20 h-5 w-5 rounded-full bg-[#4C8DFF]" />

          </section>

        </div>

      </div>

    </main>
  );
}