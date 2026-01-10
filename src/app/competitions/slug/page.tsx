// app/competitions/[slug]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface GameTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface LeaderboardEntry {
  rank: number;
  email: string;
  best_score: number;
}

const GAME_DURATION = 30; // 30 de secunde
const TARGET_SIZE_MIN = 60;
const TARGET_SIZE_MAX = 100;
const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 
  'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
];

export default function DailyCompetitionPage() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hits, setHits] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Efect pentru timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  // Efect pentru accuracy
  useEffect(() => {
    if (totalClicks > 0) {
      setAccuracy(Math.round((hits / totalClicks) * 100));
    }
  }, [hits, totalClicks]);

  const spawnTarget = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const newTarget: GameTarget = {
      id: Date.now(),
      x: Math.random() * 85, // 85% pentru a evita marginile
      y: Math.random() * 85,
      size: Math.random() * (TARGET_SIZE_MAX - TARGET_SIZE_MIN) + TARGET_SIZE_MIN,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    
    setTargets(prev => [...prev, newTarget]);
    
    // Auto-remove target after 1.5 seconds (creates challenge)
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== newTarget.id));
      setStreak(0);
    }, 1500);
  }, [gameState]);

  // Spawn targets periodically
  useEffect(() => {
    let spawnInterval: NodeJS.Timeout;
    
    if (gameState === 'playing') {
      spawnTarget(); // Primul target
      spawnInterval = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance to spawn
          spawnTarget();
        }
      }, 800); // Spawn la fiecare 0.8 secunde
    }
    
    return () => clearInterval(spawnInterval);
  }, [gameState, spawnTarget]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setTargets([]);
    setStreak(0);
    setMisses(0);
    setHits(0);
    setTotalClicks(0);
    setAccuracy(0);
  };

  const handleTargetClick = (targetId: number) => {
    if (gameState !== 'playing') return;
    
    setTotalClicks(prev => prev + 1);
    setHits(prev => prev + 1);
    
    // Calculare punctaj pe baza size-ului și streak-ului
    const target = targets.find(t => t.id === targetId);
    if (!target) return;
    
    const sizeBonus = Math.round((TARGET_SIZE_MAX - target.size) / 10);
    const streakBonus = Math.min(streak * 2, 10);
    const points = 10 + sizeBonus + streakBonus;
    
    setScore(prev => prev + points);
    setStreak(prev => prev + 1);
    
    // Remove the clicked target
    setTargets(prev => prev.filter(t => t.id !== targetId));
    
    // Spawn new target imediat
    setTimeout(() => spawnTarget(), 100);
  };

  const handleMissClick = () => {
    if (gameState !== 'playing') return;
    
    setTotalClicks(prev => prev + 1);
    setMisses(prev => prev + 1);
    setStreak(0);
    setScore(prev => Math.max(0, prev - 2)); // Penalizare 2 puncte
  };

  const endGame = async () => {
    setGameState('finished');
    
    // Calculare scor final cu bonusuri
    const accuracyBonus = Math.round(accuracy * 0.5);
    const streakBonus = Math.round(streak * 1.5);
    const finalScore = score + accuracyBonus + streakBonus;
    
    setLastScore(finalScore);
    
    // Submit scor la Supabase
    await submitScore(finalScore);
    
    // Încărcare leaderboard
    await loadLeaderboard();
  };

  const submitScore = async (finalScore: number) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .rpc('submit_daily_score', { score: finalScore });
      
      if (error) throw error;
      
      console.log('Score submitted successfully:', data);
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Folosim view-ul daily_leaderboard
      const { data: leaderboardData, error } = await supabase
        .from('daily_leaderboard')
        .select('*')
        .limit(10)
        .order('best_score', { ascending: false });
      
      if (error) throw error;
      
      // Adăugăm rank-uri
      const rankedData = leaderboardData.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setLeaderboard(rankedData);
      
      // Obținem poziția curentă a user-ului
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const userEntry = rankedData.find(entry => 
          entry.email === userData.user.email
        );
        if (userEntry) {
          setPlayerRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Încărcare leaderboard la mount
  useEffect(() => {
    if (gameState === 'idle') {
      loadLeaderboard();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link 
            href="/dashboard" 
            className="text-gray-400 hover:text-white mb-4 inline-block"
          >
            ← Înapoi la Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            🎯 Reflex Click Arena
          </h1>
          <p className="text-gray-400 text-lg">
            Click pe cercuri cât mai repede și precis pentru puncte maxime!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coloana 1: Panou de control și statistici */}
          <div className="space-y-6">
            {/* Panou de control joc */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Control Joc</h2>
              
              {gameState === 'idle' && (
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20"
                >
                  🚀 START JOC
                </button>
              )}
              
              {gameState === 'playing' && (
                <button
                  onClick={() => setGameState('finished')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl text-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  ⏹️ STOP JOC
                </button>
              )}
              
              {gameState === 'finished' && (
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl text-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                >
                  🔄 JOACĂ DIN NOU
                </button>
              )}
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Timp rămas:</span>
                  <span className={`text-2xl font-bold ${
                    timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-white'
                  }`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Scor:</span>
                  <span className="text-3xl font-bold text-yellow-400">
                    {score}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Streak:</span>
                  <span className={`text-xl font-bold ${
                    streak > 5 ? 'text-green-400' : 'text-white'
                  }`}>
                    {streak} 🔥
                  </span>
                </div>
              </div>
            </div>

            {/* Statistici */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">📊 Statistici</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <div className="text-3xl font-bold text-green-400">{hits}</div>
                  <div className="text-gray-400 text-sm">Hit-uri</div>
                </div>
                
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <div className="text-3xl font-bold text-red-400">{misses}</div>
                  <div className="text-gray-400 text-sm">Miss-uri</div>
                </div>
                
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-400">{accuracy}%</div>
                  <div className="text-gray-400 text-sm">Precizie</div>
                </div>
                
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <div className="text-3xl font-bold text-purple-400">
                    {totalClicks}
                  </div>
                  <div className="text-gray-400 text-sm">Total Click-uri</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coloana 2: Arena de joc */}
          <div className="lg:col-span-2">
            <div 
              className="relative bg-gray-900/30 backdrop-blur-sm rounded-2xl border-2 border-gray-700 overflow-hidden"
              style={{ height: '600px' }}
              onClick={handleMissClick}
            >
              {/* Arena de joc */}
              <div className="absolute inset-0">
                {gameState === 'playing' && (
                  <>
                    {/* Grid pattern subtle */}
                    <div className="absolute inset-0 opacity-10">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="absolute h-full w-px bg-white" style={{ left: `${i * 5}%` }}></div>
                      ))}
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="absolute w-full h-px bg-white" style={{ top: `${i * 5}%` }}></div>
                      ))}
                    </div>
                    
                    {/* Instrucțiuni */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="text-lg font-semibold bg-black/50 px-4 py-2 rounded-full">
                        ⚡ Click pe cercuri pentru puncte! ⚡
                      </div>
                    </div>
                  </>
                )}
                
                {gameState === 'finished' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-black/70 p-8 rounded-2xl backdrop-blur-sm">
                      <div className="text-6xl mb-4">🎉</div>
                      <div className="text-3xl font-bold mb-2">Joc Terminat!</div>
                      <div className="text-5xl font-bold text-yellow-400 mb-4">
                        {lastScore} puncte
                      </div>
                      <div className="text-gray-300">
                        Poziția ta: {playerRank ? `#${playerRank}` : 'Se încarcă...'}
                      </div>
                      {isSubmitting && (
                        <div className="mt-4 text-blue-400">
                          Se încarcă scorul...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Targets */}
                {targets.map(target => (
                  <button
                    key={target.id}
                    className={`absolute rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 ${target.color}`}
                    style={{
                      left: `${target.x}%`,
                      top: `${target.y}%`,
                      width: `${target.size}px`,
                      height: `${target.size}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTargetClick(target.id);
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg drop-shadow-lg">
                        +{Math.round((TARGET_SIZE_MAX - target.size) / 10 + 10)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Game state overlay */}
              {gameState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <div className="text-3xl font-bold mb-4">Gata de acțiune?</div>
                    <div className="text-gray-300 max-w-md mx-auto">
                      Ai 30 de secunde să atingi cât mai multe cercuri.
                      <br />
                      <span className="text-yellow-400">Cercuri mai mici = mai multe puncte!</span>
                    </div>
                    <div className="mt-6 bg-gray-800/50 p-4 rounded-xl">
                      <div className="font-semibold mb-2">📋 Reguli:</div>
                      <ul className="text-left text-sm text-gray-300 space-y-1">
                        <li>• Click pe cerc = +10 puncte + bonus dimensiune</li>
                        <li>• Streak-uri cresc bonusurile (+2 puncte per streak)</li>
                        <li>• Miss click = -2 puncte și reset streak</li>
                        <li>• Cercuri dispar după 1.5 secunde</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard - vizibil mereu */}
            {leaderboard.length > 0 && (
              <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">🏆 Top Jucători</h2>
                  <button
                    onClick={loadLeaderboard}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    🔄 Refresh
                  </button>
                </div>
                
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.email}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.email === playerRank ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50' :
                        entry.rank <= 3 ? 'bg-gradient-to-r from-gray-900 to-gray-800' :
                        'bg-gray-900/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500 text-black' :
                          entry.rank === 2 ? 'bg-gray-400 text-black' :
                          entry.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="font-medium">
                          {entry.email}
                          {entry.email === playerRank && (
                            <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">
                              TU
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-yellow-400">
                        {entry.best_score}
                      </div>
                    </div>
                  ))}
                </div>
                
                {playerRank && playerRank > 10 && (
                  <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-400">
                    Poziția ta în top: <span className="font-bold text-white">#{playerRank}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer cu informații */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            🎮 Jocul se salvează automat. Poți juca o dată pe zi pentru clasamentul zilnic.
          </p>
          <p className="mt-1">
            Scorul se calculează: puncte bază + bonus precizie + bonus streak
          </p>
        </div>
      </div>
    </div>
  );
}