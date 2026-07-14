'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<{id: string, name: string} | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); // НОВОЕ: Состояние истории
  const [playedHistory, setPlayedHistory] = useState<any[]>([]); // НОВОЕ: Сыгранные
  const [isLoading, setIsLoading] = useState(true);
  
  const [joinPin, setJoinPin] = useState('');

  
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinPin.trim().length > 0 && user) {
      
      router.push(`/room/${joinPin}?name=${encodeURIComponent(user.name)}`);
    }
  };

  
  const handleDeleteQuiz = async (quizId: string) => {
    const confirmDelete = confirm('Вы уверены, что хотите удалить этот квиз? Все его вопросы и статистика будут безвозвратно стерты!');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      } else {
        const data = await res.json();
        alert(data.message || 'Ошибка при удалении квиза');
      }
    } catch (error) {
      console.error('Ошибка при удалении квиза:', error);
      alert('Произошла ошибка при отправке запроса');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('quiz_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchData = async () => {
      try {
        // Запрашиваем квизы И историю параллельно
        const [quizzesRes, historyRes] = await Promise.all([
          fetch(`/api/quizzes?creatorId=${parsedUser.id}`),
          fetch(`/api/history?userId=${parsedUser.id}`)
        ]);

        if (quizzesRes.ok) {
          const qData = await quizzesRes.json();
          setQuizzes(qData.quizzes);
        }
        
        if (historyRes.ok) {
          const hData = await historyRes.json();
          setHistory(hData.hostedGames);
          setPlayedHistory(hData.playedGames); // Сохраняем сыгранные
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('quiz_user');
    router.push('/login');
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-950 text-purple-300 flex items-center justify-center">Проверка доступа...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white">
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg">Q</div>
            <span className="font-bold text-xl tracking-wider text-purple-200">QUIZ.BOOM</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-purple-200">Привет, <span className="font-semibold text-white">{user.name}</span>!</span>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-purple-300 hover:text-white bg-white/5 rounded-xl transition-all">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Блок создания */}
          <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col justify-center items-start relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            <h1 className="text-3xl font-extrabold mb-2 relative z-10">Панель управления</h1>
            <p className="text-purple-200 mb-6 relative z-10">Создавайте свои квизы или смотрите историю.</p>
            <Link href="/create-quiz" className="px-6 py-3 font-semibold rounded-xl text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all relative z-10">
              ➕ Создать квиз
            </Link>
          </div>

          {/* НОВОЕ: Блок быстрого старта */}
          <div className="flex-1 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-8 rounded-2xl flex flex-col justify-center relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-2 text-white">Сыграть прямо сейчас</h2>
            <p className="text-purple-200 mb-5 text-sm">Есть PIN-код комнаты? Залетайте в игру!</p>
            
            <form onSubmit={handleJoinGame} className="flex gap-3">
              <input
                type="text"
                placeholder="PIN"
                maxLength={4}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))} // Только цифры
                className="w-24 px-2 py-3 bg-white/10 border border-white/20 rounded-xl text-center text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={!joinPin}
                className="flex-1 px-4 py-3 bg-white text-indigo-950 font-black rounded-xl hover:bg-purple-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-sm sm:text-base"
              >
                ПРИСОЕДИНИТЬСЯ ➔
              </button>
            </form>
          </div>
        </div>

        {/* --- СЕКЦИЯ: МОИ КВИЗЫ --- */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Библиотека квизов</h2>
          {isLoading ? (
            <div className="animate-pulse text-purple-300">Загрузка...</div>
          ) : quizzes.length === 0 ? (
            <div className="text-purple-300/50">У вас пока нет квизов.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative group overflow-hidden">
                  {}
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="Удалить квиз"
                  >
                    🗑️
                  </button>

                  <h3 className="text-xl font-bold mb-2 pr-8">{quiz.title}</h3>
                  <p className="text-sm text-purple-200 mb-6 flex-grow">{quiz.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/quiz/${quiz.id}`} className="text-xs text-center py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">⚙️ Вопросы</Link>
                    <Link href={`/play/${quiz.id}`} className="text-xs text-center py-2 bg-purple-600 rounded-xl hover:bg-purple-500 transition-all">🎮 Играть</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- СЕКЦИЯ: ИСТОРИЯ ИГР --- */}
        <div>
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">История проведенных игр</h2>
          {isLoading ? (
            <div className="animate-pulse text-purple-300">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="text-purple-300/50 bg-white/5 p-8 rounded-2xl border border-white/10 text-center">
              Вы еще не провели ни одной игры. Запустите свой первый квиз!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((game) => (
                <div key={game.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{game.quizTitle}</h3>
                    <span className="text-xs text-purple-300">
                      {new Date(game.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  
                  <div className="flex-grow max-w-xl w-full bg-black/20 rounded-xl p-4">
                    <h4 className="text-xs uppercase text-purple-400 font-bold mb-2 tracking-wider">Победители:</h4>
                    <div className="flex flex-col gap-1">
                      {game.players.slice(0, 3).map((player: any) => ( // Показываем только Топ-3
                        <div key={player.id} className="flex justify-between text-sm">
                          <span>
                            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'} {player.playerName}
                          </span>
                          <span className="font-bold text-purple-200">{player.score} очков</span>
                        </div>
                      ))}
                      {game.players.length === 0 && <span className="text-sm text-gray-500">Нет данных об игроках</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- СЕКЦИЯ: МОИ УЧАСТИЯ --- */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Мои участия в квизах</h2>
          {isLoading ? (
            <div className="animate-pulse text-purple-300">Загрузка...</div>
          ) : playedHistory.length === 0 ? (
            <div className="text-purple-300/50 bg-white/5 p-8 rounded-2xl border border-white/10 text-center">
              Вы еще не участвовали в чужих играх.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playedHistory.map((play, idx) => (
                <div key={idx} className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{play.gameResult.quizTitle}</h3>
                    <span className="text-xs text-purple-300">{new Date(play.gameResult.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      #{play.rank} место
                    </div>
                    <div className="text-sm font-bold text-purple-200">{play.score} очков</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}