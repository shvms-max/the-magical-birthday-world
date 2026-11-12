import { AnimatePresence, motion } from 'framer-motion';
import {
  Cake,
  Camera,
  Cloud,
  Gamepad2,
  Gift,
  Heart,
  Home,
  ImageIcon,
  Lock,
  Sparkles,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { birthdayConfig, galleryMoments, treasureSeeds } from './config';

type Tab = 'home' | 'games' | 'treasures' | 'memories';

type Treasure = {
  id: number;
  title: string;
  emoji: string;
  joke: string;
  compliment: string;
  riddle: string;
  gift: string;
  reward: number;
  unlocked: boolean;
};

type MemoryCard = {
  id: string;
  symbol: string;
  matched: boolean;
  flipped: boolean;
};

type FallingStar = {
  id: number;
  x: number;
  y: number;
  speed: number;
};

type Balloon = {
  id: number;
  x: number;
  y: number;
  color: string;
};

const STORAGE_KEYS = {
  sound: 'magic-birthday-sound',
  treasures: 'magic-birthday-treasures',
  gift: 'magic-birthday-gift',
  scores: 'magic-birthday-scores',
  best: 'magic-birthday-best-scores',
};

const createMemoryDeck = (): MemoryCard[] => {
  const symbols = ['🐰', '🦄', '🐼', '🦋', '✨', '🌈'];
  const deck = symbols.flatMap((symbol, index) => [
    { id: `${symbol}-${index}-a`, symbol, matched: false, flipped: false },
    { id: `${symbol}-${index}-b`, symbol, matched: false, flipped: false },
  ]);

  return deck
    .map((card) => ({ ...card, id: `${card.id}-${Math.random().toString(16).slice(2, 7)}` }))
    .sort(() => Math.random() - 0.5);
};

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [soundOn, setSoundOn] = useState<boolean>(() => readStorage(STORAGE_KEYS.sound, true));
  const [candles, setCandles] = useState<Array<{ id: number; lit: boolean }>>(
    () => Array.from({ length: 9 }, (_, index) => ({ id: index + 1, lit: false })),
  );
  const [wishMade, setWishMade] = useState(false);
  const [treasures, setTreasures] = useState<Treasure[]>(() =>
    readStorage(STORAGE_KEYS.treasures, treasureSeeds.map((item) => ({ ...item }))),
  );
  const [giftOpened, setGiftOpened] = useState<boolean>(() => readStorage(STORAGE_KEYS.gift, false));
  const [scores, setScores] = useState(() =>
    readStorage(STORAGE_KEYS.scores, { stars: 0, balloons: 0, memory: 0 }),
  );
  const [bestScores, setBestScores] = useState(() =>
    readStorage(STORAGE_KEYS.best, { stars: 0, balloons: 0, memory: 0 }),
  );
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sound, JSON.stringify(soundOn));
  }, [soundOn]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.treasures, JSON.stringify(treasures));
  }, [treasures]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.gift, JSON.stringify(giftOpened));
  }, [giftOpened]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.best, JSON.stringify(bestScores));
  }, [bestScores]);

  useEffect(() => {
    if (candles.every((candle) => candle.lit)) {
      playSfx('yay');
    }
  }, [candles]);

  const allCandlesLit = candles.every((candle) => candle.lit);
  const discoveredTreasures = treasures.filter((treasure) => treasure.unlocked).length;
  const totalTreasureStars = treasures
    .filter((treasure) => treasure.unlocked)
    .reduce((sum, item) => sum + item.reward, 0);

  const playSfx = (kind: 'magic' | 'coin' | 'pop' | 'match' | 'yay') => {
    if (!soundOn || typeof window === 'undefined') return;

    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const context = audioRef.current ?? new AudioCtor();
    audioRef.current = context;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = kind === 'pop' ? 'square' : kind === 'match' ? 'triangle' : 'sine';

    const frequencies = {
      magic: [440, 554.37],
      coin: [660, 880],
      pop: [407, 210],
      match: [523.25, 659.25],
      yay: [392, 523.25, 659.25],
    };

    oscillator.frequency.setValueAtTime(frequencies[kind][0], now);
    oscillator.frequency.linearRampToValueAtTime(frequencies[kind][1], now + 0.18);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(kind === 'pop' ? 0.09 : 0.06, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2 + (kind === 'yay' ? 0.1 : 0));

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24 + (kind === 'yay' ? 0.1 : 0));
  };

  const lightCandle = (id: number) => {
    setCandles((current) =>
      current.map((candle) => (candle.id === id ? { ...candle, lit: true } : candle)),
    );
    playSfx('magic');
  };

  const unlockTreasure = (id: number) => {
    setTreasures((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, unlocked: true }
          : item,
      ),
    );
    playSfx('coin');
  };

  const openGift = () => {
    setGiftOpened(true);
    playSfx('yay');
  };

  const celebrateAgain = () => {
    setCandles(Array.from({ length: 9 }, (_, index) => ({ id: index + 1, lit: false })));
    setWishMade(false);
    setGiftOpened(false);
    setTab('home');
    setTreasures((current) => current.map((item) => ({ ...item, unlocked: false })));
    setScores({ stars: 0, balloons: 0, memory: 0 });
    playSfx('yay');
  };

  const updateGameScore = (game: 'stars' | 'balloons' | 'memory', value: number) => {
    setScores((current) => {
      const next = { ...current, [game]: value };
      setBestScores((best) => ({
        ...best,
        [game]: Math.max(best[game], value),
      }));
      return next;
    });
  };

  const homeBadge = useMemo(
    () => `✨ ${discoveredTreasures}/5 magical treasures discovered`,
    [discoveredTreasures],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#ffe7f9,_#e9d7ff_30%,_#cfe9ff_75%,_#dff7ff_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.div
            key={`star-${index}`}
            className="absolute rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            style={{
              width: index % 3 === 0 ? 6 : 8,
              height: index % 3 === 0 ? 6 : 8,
              left: `${(index * 17) % 100}%`,
              top: `${(index * 19) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.4],
              scale: [1, 1.5, 1],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3 + (index % 5),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        <Cloud className="absolute -left-5 top-16 h-14 w-14 text-white/70" />
        <Cloud className="absolute right-0 top-24 h-12 w-12 text-white/60" />
        <Cloud className="absolute left-10 top-64 h-10 w-10 text-white/50" />
      </div>

      <AnimatePresence>
        {!entered ? (
          <motion.div
            key="welcome"
            className="relative z-20 flex min-h-screen items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.7),_rgba(255,255,255,0.1)_35%,_transparent_70%)]" />
            <motion.div
              className="glass-card relative w-full max-w-sm rounded-[2rem] border border-white/50 p-6 text-center"
              initial={{ y: 32, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], y: [0, -10, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-fuchsia-200 text-5xl shadow-[0_20px_40px_rgba(245,120,178,0.4)]"
              >
                🌟
              </motion.div>
              <p className="text-lg font-black uppercase tracking-[0.2em] text-pink-500">{birthdayConfig.headline}</p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-xl font-bold text-purple-700"
              >
                {birthdayConfig.introLine}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-3 text-2xl font-black text-pink-600"
              >
                {birthdayConfig.magicLine}
              </motion.p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setEntered(true)}
                className="magic-button mt-8 w-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-4 py-4 text-lg font-black text-white shadow-[0_16px_30px_rgba(168,85,247,0.45)]"
              >
                ENTER MY MAGICAL WORLD ✨
              </motion.button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {entered ? (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col bg-transparent pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <header className="px-4">
            <div className="glass-card flex items-center justify-between rounded-[1.7rem] px-3 py-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500">Birthday world</p>
                <h1 className="text-lg font-black text-pink-600">{birthdayConfig.name}'s Magic</h1>
                <p className="text-[9px] font-bold text-violet-600">{homeBadge}</p>
              </div>
              <div className="rounded-full bg-white/60 p-2 text-pink-500 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-4">
            {tab === 'home' ? (
              <div className="space-y-5">
                <motion.div
                  className="glass-card rounded-[2rem] p-4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Birthday surprise</p>
                      <h2 className="mt-1 text-2xl font-black text-pink-600">Magic celebration</h2>
                    </div>
                    <div className="rounded-full bg-gradient-to-r from-pink-400 to-violet-400 p-2 text-white shadow-md">
                      <Cake className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="relative mx-auto mt-4 h-44 w-full max-w-[260px]">
                    <div className="absolute inset-x-5 bottom-0 h-16 rounded-[1.5rem] bg-gradient-to-r from-pink-300 via-rose-200 to-orange-200 shadow-[0_18px_32px_rgba(244,114,182,0.25)]" />
                    <div className="absolute inset-x-8 bottom-10 h-5 rounded-full bg-gradient-to-r from-yellow-300 to-orange-300" />
                    <div className="absolute inset-x-10 bottom-14 h-14 rounded-t-[2rem] rounded-b-lg bg-gradient-to-r from-pink-200 via-yellow-100 to-rose-200 shadow-inner" />
                    <div className="absolute bottom-16 left-8 right-8 flex justify-between px-1">
                      {candles.map((candle) => (
                        <motion.button
                          key={candle.id}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => lightCandle(candle.id)}
                          className="relative h-14 w-6 rounded-t-xl bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                          style={{ opacity: candle.lit ? 1 : 0.7 }}
                        >
                          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-200 to-orange-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
                          {candle.lit ? <span className="absolute -top-6 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-yellow-300 shadow-[0_0_16px_rgba(253,224,71,0.8)]" /> : null}
                        </motion.button>
                      ))}
                    </div>
                    <div className="absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 rounded-full bg-white/30 blur-2xl" />
                  </div>

                  <div className="mt-5 text-center">
                    {allCandlesLit ? (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-2 flex justify-center gap-2 text-3xl">
                          {['✨', '🎉', '🎊', '🎈'].map((icon) => (
                            <motion.span key={icon} animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                              {icon}
                            </motion.span>
                          ))}
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">Birthday magic activated</p>
                        <h3 className="mt-2 text-3xl font-black text-pink-600">{birthdayConfig.message}</h3>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setWishMade(true)}
                          className="magic-button mt-4 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-3 text-sm font-black text-white"
                        >
                          MAKE A WISH 🌠
                        </motion.button>
                      </motion.div>
                    ) : (
                      <p className="text-sm font-bold text-violet-700">Tap each candle to light the magic ✨</p>
                    )}
                  </div>
                </motion.div>

                {wishMade ? (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-[2rem] p-4"
                  >
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-indigo-200 via-sky-100 to-pink-200 p-4">
                      <motion.div
                        className="absolute -left-3 top-5 text-3xl"
                        initial={{ x: -30, y: 12, opacity: 0 }}
                        animate={{ x: 180, y: -40, opacity: [0, 1, 0] }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                      >
                        ✨
                      </motion.div>
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-700">Wish granted</p>
                      <p className="mt-2 text-lg font-bold text-fuchsia-700">
                        “Mayra wishes for more sparkle, laughter, and magic every single day.”
                      </p>
                    </div>
                  </motion.div>
                ) : null}

                <motion.div className="glass-card rounded-[2rem] p-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Magic stats</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Stars', value: scores.stars, icon: '✨' },
                      { label: 'Pops', value: scores.balloons, icon: '🎈' },
                      { label: 'Memory', value: scores.memory, icon: '🧠' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1.1rem] bg-white/45 p-2 text-center">
                        <div className="text-lg">{item.icon}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">{item.label}</div>
                        <div className="text-base font-black text-violet-700">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-full bg-violet-100 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                    Best: ✨ {bestScores.stars} • 🎈 {bestScores.balloons} • 🧠 {bestScores.memory}
                  </div>
                </motion.div>

                <motion.div className="glass-card rounded-[2rem] p-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Big surprise</p>
                    <Gift className="h-5 w-5 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-black text-violet-700">Ready for your biggest surprise?</h3>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={openGift}
                    className="magic-button mt-4 w-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 px-4 py-3 text-sm font-black text-white"
                  >
                    OPEN MY GIFT 🎁
                  </motion.button>
                  {giftOpened ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 rounded-[1.5rem] bg-gradient-to-r from-pink-100 via-violet-50 to-sky-100 p-4 text-center"
                    >
                      <div className="mb-2 flex justify-center gap-2 text-2xl">
                        <Heart className="text-pink-500" />
                        <Sparkles className="text-violet-500" />
                        <Heart className="text-pink-500" />
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{birthdayConfig.giftMessage}</p>
                    </motion.div>
                  ) : null}
                </motion.div>

                <motion.div
                  className="glass-card rounded-[2rem] p-4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Grand finale</p>
                  <h3 className="mt-2 text-2xl font-black text-pink-600">{birthdayConfig.finale}</h3>
                  <div className="mt-3 text-center text-4xl font-black text-violet-700">{birthdayConfig.name}</div>
                  <div className="mt-4 flex items-center justify-center gap-3 text-3xl">
                    {['🎉', '✨', '🎊', '💖', '🌈'].map((icon, index) => (
                      <motion.span
                        key={`${icon}-${index}`}
                        animate={{ y: [0, -8, 0], rotate: [0, 8, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.18 }}
                      >
                        {icon}
                      </motion.span>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={celebrateAgain}
                    className="magic-button mt-4 w-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 px-4 py-3 text-sm font-black text-white"
                  >
                    CELEBRATE AGAIN! 🎉
                  </motion.button>
                </motion.div>
              </div>
            ) : null}

            {tab === 'games' ? (
              <div className="space-y-5 pb-4">
                <GameOne soundOn={soundOn} onFinish={(value) => updateGameScore('stars', value)} />
                <GameTwo soundOn={soundOn} onFinish={(value) => updateGameScore('balloons', value)} />
                <GameThree soundOn={soundOn} onFinish={(value) => updateGameScore('memory', value)} />
              </div>
            ) : null}

            {tab === 'treasures' ? (
              <div className="space-y-5 pb-4">
                <div className="glass-card rounded-[2rem] p-4">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Treasure hunt</p>
                      <h2 className="mt-1 text-2xl font-black text-pink-600">Mystic chests</h2>
                    </div>
                    <div className="rounded-full bg-gradient-to-r from-violet-400 to-pink-400 px-2 py-1 text-sm font-black text-white">
                      {discoveredTreasures}/5
                    </div>
                  </div>
                  <div className="mb-4 flex items-center justify-between rounded-full bg-white/40 px-3 py-2 text-xs font-bold text-violet-700">
                    <span>Progress</span>
                    <span>{discoveredTreasures}/5 treasures discovered</span>
                  </div>
                  <div className="mb-4 flex items-center justify-between rounded-full bg-gradient-to-r from-pink-100 to-violet-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                    <span>Magic gems</span>
                    <span>{totalTreasureStars} ✨</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {treasures.map((treasure) => (
                      <motion.button
                        key={treasure.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => !treasure.unlocked && unlockTreasure(treasure.id)}
                        className={`${treasure.unlocked ? 'bg-gradient-to-br from-emerald-200 to-cyan-200' : 'bg-gradient-to-br from-violet-200 to-pink-200'} relative overflow-hidden rounded-[1.4rem] border border-white/50 p-3 text-left shadow-lg`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-3xl">{treasure.emoji}</span>
                          <span className="rounded-full bg-white/65 px-2 py-1 text-[10px] font-black text-violet-700">
                            {treasure.reward} ✨
                          </span>
                        </div>
                        <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
                          {treasure.unlocked ? 'Unlocked' : 'Locked'}
                        </div>
                        <p className="text-sm font-bold text-slate-800">{treasure.unlocked ? treasure.title : 'Mystery chest'}</p>
                        <div className="mt-3 rounded-xl bg-white/40 p-2 text-[11px] text-slate-700">
                          {treasure.unlocked ? (
                            <>
                              <div className="font-black text-purple-700">{treasure.compliment}</div>
                              <div className="mt-2">Joke: {treasure.joke}</div>
                              <div className="mt-1">Riddle: {treasure.riddle}</div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 font-black text-violet-700">
                              {treasure.unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              Tap to unlock
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'memories' ? (
              <div className="space-y-5 pb-4">
                <div className="glass-card rounded-[2rem] p-4 text-center">
                  <div className="mb-3 flex items-center justify-center gap-2 text-pink-500">
                    <Camera className="h-5 w-5" />
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-2xl font-black text-violet-700">Our Little Collection of Happy Memories</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">A tiny scrapbook of all the sparkle and smiles.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {galleryMoments.map((moment, index) => (
                    <motion.div
                      key={moment.title}
                      whileHover={{ y: -4 }}
                      className={`relative overflow-hidden rounded-[1.4rem] border border-white/60 bg-gradient-to-br ${moment.accent} p-3 shadow-lg`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                    >
                      <div className="absolute right-2 top-2 rounded-full bg-white/40 p-1 text-lg">{moment.sticker}</div>
                      <div className="mt-12 flex min-h-[140px] flex-col justify-between rounded-[1rem] bg-white/30 p-3 backdrop-blur-sm">
                        <div className="text-5xl">{moment.emoji}</div>
                        <div className="mt-3 text-sm font-black uppercase tracking-[0.15em] text-violet-700">{moment.title}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null}
          </main>

          <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center justify-around rounded-t-[1.7rem] border border-white/50 bg-white/55 px-2 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-8px_24px_rgba(148,163,184,0.25)] backdrop-blur-md">
            {[
              { key: 'home', label: 'Home', icon: Home },
              { key: 'games', label: 'Games', icon: Gamepad2 },
              { key: 'treasures', label: 'Treasures', icon: Trophy },
              { key: 'memories', label: 'Memories', icon: ImageIcon },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key as Tab)}
                  className={`flex w-full flex-col items-center gap-1 rounded-full px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${active ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-violet-600'}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}

      <button
        onClick={() => setSoundOn((current) => !current)}
        className="fixed z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 text-violet-700 shadow-lg backdrop-blur-md"
        style={{
          top: 'calc(env(safe-area-inset-top) + 1rem)',
          right: 'calc(env(safe-area-inset-right) + 1rem)',
        }}
      >
        {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </div>
  );
}

type GameProps = {
  soundOn: boolean;
  onFinish: (value: number) => void;
};

function GameOne({ soundOn, onFinish }: GameProps) {
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [basketX, setBasketX] = useState(50);
  const [stars, setStars] = useState<FallingStar[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!playing) return;

    const spawnTimer = window.setInterval(() => {
      setStars((current) => [
        ...current,
        {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80,
          y: -5,
          speed: 3 + Math.random() * 4,
        },
      ]);
    }, 550);

    const gameTimer = window.setInterval(() => {
      setStars((current) => {
        const nextStars = current.map((star) => ({ ...star, y: star.y + star.speed }));
        const caught = nextStars.filter(
          (star) => star.y > 72 && star.x > basketX - 12 && star.x < basketX + 12,
        );

        if (caught.length > 0) {
          setScore((currentScore) => currentScore + caught.length);
          if (soundOn) {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 660;
            gain.gain.value = 0.02;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.08);
          }
        }

        return nextStars.filter(
          (star) => star.y <= 100 && !caught.some((caughtStar) => caughtStar.id === star.id),
        );
      });

      setTimeLeft((current) => {
        if (current <= 1) {
          setPlaying(false);
          return 0;
        }
        return current - 1;
      });
    }, 140);

    return () => {
      window.clearInterval(spawnTimer);
      window.clearInterval(gameTimer);
    };
  }, [basketX, playing, soundOn]);

  useEffect(() => {
    if (timeLeft === 0 && score > 0) {
      onFinish(score);
    }
  }, [score, timeLeft, onFinish]);

  const handleMove = (delta: number) => {
    setBasketX((current) => clamp(current + delta, 12, 88));
  };

  return (
    <div className="glass-card rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Game 1</p>
          <h3 className="mt-1 text-xl font-black text-pink-600">Catch the Stars</h3>
        </div>
        <div className="rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 px-3 py-1 text-sm font-black text-violet-700">
          {score} pts
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-700">
        <span>Time: {timeLeft}s</span>
        <button
          onClick={() => {
            setPlaying(true);
            setScore(0);
            setTimeLeft(30);
            setStars([]);
            setBasketX(50);
          }}
          className="rounded-full bg-violet-500 px-3 py-1 text-white"
        >
          {playing ? 'Restart' : 'Play'}
        </button>
      </div>

      <div className="relative h-56 overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-sky-100 via-indigo-100 to-pink-100">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute text-xl"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
          >
            ✨
          </div>
        ))}

        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <motion.div
            animate={{ left: `${basketX}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            className="absolute -translate-x-1/2 bottom-0 h-10 w-16 rounded-t-[1.2rem] bg-gradient-to-r from-pink-400 to-violet-500 shadow-[0_10px_18px_rgba(168,85,247,0.35)]"
          >
            <div className="absolute inset-x-3 top-2 h-3 rounded-full bg-white/70" />
          </motion.div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-3">
        <button onClick={() => handleMove(-12)} className="rounded-full bg-white/80 px-4 py-2 font-black text-violet-700">
          ◀ Left
        </button>
        <button onClick={() => handleMove(12)} className="rounded-full bg-white/80 px-4 py-2 font-black text-violet-700">
          Right ▶
        </button>
      </div>
    </div>
  );
}

function GameTwo({ soundOn, onFinish }: GameProps) {
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);

  useEffect(() => {
    if (!playing) return;

    const spawnTimer = window.setInterval(() => {
      setBalloons((current) => [
        ...current,
        {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80,
          y: 100,
          color: ['#f9a8d4', '#c4b5fd', '#93c5fd', '#fcd34d', '#a7f3d0'][
            Math.floor(Math.random() * 5)
          ],
        },
      ]);
    }, 500);

    const moveTimer = window.setInterval(() => {
      setBalloons((current) =>
        current
          .map((balloon) => ({ ...balloon, y: balloon.y - 4 }))
          .filter((balloon) => balloon.y > -8),
      );
      setTimeLeft((current) => {
        if (current <= 1) {
          setPlaying(false);
          return 0;
        }
        return current - 1;
      });
    }, 140);

    return () => {
      window.clearInterval(spawnTimer);
      window.clearInterval(moveTimer);
    };
  }, [playing]);

  useEffect(() => {
    if (timeLeft === 0 && score > 0) {
      onFinish(score);
    }
  }, [score, timeLeft, onFinish]);

  const popBalloon = (id: number) => {
    setBalloons((current) => current.filter((balloon) => balloon.id !== id));
    setScore((current) => current + 1);
    if (soundOn) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = 420;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    }
  };

  return (
    <div className="glass-card rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Game 2</p>
          <h3 className="mt-1 text-xl font-black text-pink-600">Pop the Balloons</h3>
        </div>
        <div className="rounded-full bg-gradient-to-r from-pink-400 to-orange-300 px-3 py-1 text-sm font-black text-white">
          {score} pts
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-700">
        <span>Time: {timeLeft}s</span>
        <button
          onClick={() => {
            setPlaying(true);
            setScore(0);
            setTimeLeft(30);
            setBalloons([]);
          }}
          className="rounded-full bg-violet-500 px-3 py-1 text-white"
        >
          {playing ? 'Restart' : 'Play'}
        </button>
      </div>

      <div className="relative h-56 overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-blue-100 via-violet-50 to-pink-100">
        {balloons.map((balloon) => (
          <motion.button
            key={balloon.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => popBalloon(balloon.id)}
            className="absolute -translate-x-1/2" 
            style={{ left: `${balloon.x}%`, top: `${balloon.y}%` }}
          >
            <span
              className="relative block h-14 w-12 rounded-[40%] border-2 border-white/60 shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
              style={{ background: balloon.color }}
            >
              <span className="absolute inset-x-1 top-3 h-3 rounded-full bg-white/30" />
              <span className="absolute bottom-[-12px] left-1/2 h-5 w-[2px] -translate-x-1/2 bg-slate-500" />
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-white/50" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function GameThree({ soundOn, onFinish }: GameProps) {
  const [cards, setCards] = useState<MemoryCard[]>(() => createMemoryDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const resetMemory = () => {
    setCards(createMemoryDeck());
    setSelected([]);
    setScore(0);
    setWon(false);
  };

  useEffect(() => {
    if (cards.length && cards.every((card) => card.matched)) {
      setWon(true);
      onFinish(score);
    }
  }, [cards, onFinish, score]);

  const handleFlip = (index: number) => {
    if (selected.length === 2 || cards[index].matched || cards[index].flipped) return;

    const nextCards = cards.map((card, cardIndex) =>
      cardIndex === index ? { ...card, flipped: true } : card,
    );
    setCards(nextCards);
    const nextSelected = [...selected, index];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      const [firstIndex, secondIndex] = nextSelected;
      const firstCard = nextCards[firstIndex];
      const secondCard = nextCards[secondIndex];

      if (firstCard.symbol === secondCard.symbol) {
        window.setTimeout(() => {
          setCards((current) =>
            current.map((card, cardIndex) =>
              cardIndex === firstIndex || cardIndex === secondIndex
                ? { ...card, matched: true, flipped: true }
                : card,
            ),
          );
          setSelected([]);
          setScore((current) => current + 10);
          if (soundOn) {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 700;
            gain.gain.value = 0.02;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);
          }
        }, 380);
      } else {
        window.setTimeout(() => {
          setCards((current) =>
            current.map((card, cardIndex) =>
              cardIndex === firstIndex || cardIndex === secondIndex ? { ...card, flipped: false } : card,
            ),
          );
          setSelected([]);
        }, 760);
      }
    }
  };

  return (
    <div className="glass-card rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Game 3</p>
          <h3 className="mt-1 text-xl font-black text-pink-600">Magic Memory</h3>
        </div>
        <div className="rounded-full bg-gradient-to-r from-violet-400 to-pink-400 px-3 py-1 text-sm font-black text-white">
          {score} pts
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-700">
        <span>{won ? 'You won!' : 'Match all pairs'}</span>
        <button onClick={resetMemory} className="rounded-full bg-violet-500 px-3 py-1 text-white">
          Reset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleFlip(index)}
            className={`flex h-16 items-center justify-center rounded-2xl border-2 text-2xl shadow-md ${
              card.flipped || card.matched
                ? 'border-pink-200 bg-white/80'
                : 'border-violet-200 bg-gradient-to-br from-violet-300 to-pink-300 text-violet-700'
            }`}
          >
            {card.flipped || card.matched ? card.symbol : '?'}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default App;
