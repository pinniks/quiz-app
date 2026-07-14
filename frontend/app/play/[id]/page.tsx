'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function HostGamePage() {
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [pin, setPin] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isShowingResult, setIsShowingResult] = useState(false); 

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [hostId, setHostId] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
      setHostId(JSON.parse(storedUser).id);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, questionsRes] = await Promise.all([
          fetch(`/api/quizzes/${quizId}`),
          fetch(`/api/questions?quizId=${quizId}`)
        ]);
        if (quizRes.ok) setQuiz((await quizRes.json()).quiz);
        if (questionsRes.ok) setQuestions((await questionsRes.json()).questions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId]);

  useEffect(() => {
    socket = io('http://localhost:3001');
    socket.emit('create-room', quizId);

    socket.on('room-created', (newPin) => setPin(newPin));
    socket.on('players-updated', (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on('player-answered', () => setAnswersCount((prev) => prev + 1));

    socket.on('game-over', (finalScores) => {
      setLeaderboard(finalScores);
      setIsPlaying(false);
      setIsGameOver(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [quizId]);

  useEffect(() => {
    if (isGameOver && leaderboard.length > 0 && quiz && hostId) {
      const saveResults = async () => {
        try {
          await fetch('/api/games/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: quiz.id,
              quizTitle: quiz.title,
              hostId: hostId,
              leaderboard: leaderboard
            })
          });
          console.log('✅ Результаты успешно сохранены в базу!');
        } catch (error) {
          console.error('❌ Ошибка сохранения результатов:', error);
        }
      };
      saveResults();
    }
  }, [isGameOver, leaderboard, quiz, hostId]);

  useEffect(() => {
    if (isPlaying && !isGameOver && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [isPlaying, isGameOver, timeLeft]);

  const handleStartGame = () => {
    if (!pin || questions.length === 0) return alert('Нет вопросов!');
    setIsPlaying(true);
    socket.emit('start-game', pin);
    const limit = quiz?.timeLimit || 20; 
    setTimeLeft(limit);
    socket.emit('send-question', { pin, question: { ...questions[0], timeLimit: limit } });
  };

  // Кнопка "Показать ответ"
  const handleRevealAnswer = () => {
    setIsShowingResult(true);
    setTimeLeft(0); // Останавливаем таймер, если он еще шел
    socket.emit('reveal-answer', pin);
  };

  //Кнопка "Следующий вопрос"
  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setAnswersCount(0);
      setIsShowingResult(false); // Сбрасываем экран ответа
      
      const limit = quiz?.timeLimit || 20;
      setTimeLeft(limit);
      socket.emit('send-question', { pin, question: { ...questions[nextIndex], timeLimit: limit } });
    } else {
      socket.emit('end-game', pin);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-purple-300">Загрузка игры...</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <div className="max-w-4xl w-full relative z-10 flex flex-col items-center">
        
        {isGameOver ? (
          /* --- ЭКРАН ПОБЕДИТЕЛЕЙ (ЛИДЕРБОРД) --- */
          <div className="w-full text-center animate-fade-in-up">
            <h1 className="text-5xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
              🏆 ФИНАЛ ИГРЫ 🏆
            </h1>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl max-w-2xl mx-auto">
              {leaderboard.map((player, idx) => (
                <div key={idx} className={`flex justify-between items-center p-6 mb-4 rounded-2xl ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : idx === 1 ? 'bg-slate-300/20 border border-slate-300/50' : idx === 2 ? 'bg-orange-800/40 border border-orange-700/50' : 'bg-white/5 border border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black w-10">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </div>
                    <span className="text-2xl font-bold">{player.name}</span>
                  </div>
                  <div className="text-2xl font-black text-purple-300">{player.score} очков</div>
                </div>
              ))}
            </div>

            <Link href="/dashboard" className="inline-block mt-12 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-bold">
              Вернуться в Дашборд
            </Link>
          </div>
        ) : !isPlaying ? (
          /* --- ЛОББИ --- */
          <>
            <Link href="/dashboard" className="self-start text-purple-300 hover:text-white transition-colors text-sm mb-6">← Назад в панель</Link>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-10 w-full text-center shadow-2xl mb-8">
              <h1 className="text-2xl font-bold text-purple-200 mb-2">Подключайтесь к игре!</h1>
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{pin ? pin : '....'}</div>
            </div>
            
            <div className="w-full flex justify-between items-end mb-4 px-2 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold">Игроки: {players.length}</h2>
              <button onClick={handleStartGame} disabled={players.length === 0} className="px-8 py-3 bg-white text-indigo-950 font-black rounded-xl disabled:opacity-50 hover:bg-purple-200 transition-all">НАЧАТЬ ИГРУ</button>
            </div>

            {/* Сетка с именами подключившихся игроков */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {players.map((player, idx) => (
                <div key={idx} className="bg-white/10 border border-white/20 rounded-xl p-4 text-center font-bold text-lg animate-fade-in-up">
                  {player.name}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* --- ЭКРАН ВОПРОСА --- */
          <div className="w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg">
              <span className="font-bold text-purple-300">Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
              
              <div className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-yellow-400'}`}>
                ⏱ {timeLeft} сек
              </div>

              <span className="font-bold text-green-400">Ответили: {answersCount} / {players.length}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-10 text-center shadow-2xl mb-8">
              {currentQuestion?.imageUrl && <img src={currentQuestion.imageUrl} alt="img" className="max-h-64 mx-auto rounded-xl mb-6 shadow-lg" />}
              <h2 className="text-4xl font-extrabold text-white mb-8">{currentQuestion?.text}</h2>
            </div>

            {/* Варианты ответов с подсветкой */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentQuestion?.options.map((opt: string, idx: number) => {
                // Если мы показываем результат, подсвечиваем правильный ответ зеленым
                const isCorrect = isShowingResult && currentQuestion.correctAnswers?.includes(opt);
                const isWrong = isShowingResult && !isCorrect;
                
                return (
                  <div key={idx} className={`p-6 rounded-2xl text-xl font-bold text-center transition-all shadow-md ${
                    isCorrect ? 'bg-green-500 text-white border border-green-400 scale-105' : 
                    isWrong ? 'bg-white/5 text-white/30 border border-white/5' : 
                    'bg-white/5 border border-white/10 text-purple-200'
                  }`}>
                    {opt} {isCorrect && '✅'}
                  </div>
                );
              })}
            </div>

            {/* Умная кнопка */}
            <div className="flex justify-end">
              {!isShowingResult ? (
                <button onClick={handleRevealAnswer} className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-500 font-black text-white rounded-xl shadow-lg active:scale-95 transition-all">
                  ПОКАЗАТЬ ПРАВИЛЬНЫЙ ОТВЕТ 👁️
                </button>
              ) : (
                <button onClick={handleNextQuestion} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-white rounded-xl shadow-lg active:scale-95 transition-all animate-pulse">
                  {currentQuestionIndex + 1 === questions.length ? 'ПОКАЗАТЬ ИТОГИ 🏆' : 'СЛЕДУЮЩИЙ ВОПРОС ➔'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}