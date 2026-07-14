'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pin = params.pin as string;
  const playerName = searchParams.get('name') || 'Аноним';

  const [status, setStatus] = useState('Подключение...');
  const [error, setError] = useState('');

  const [isShowingResult, setIsShowingResult] = useState(false);
  const [correctAnswersFromServer, setCorrectAnswersFromServer] = useState<string[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [rank, setRank] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    socket = io('http://localhost:3001');
    // Достаем ID пользователя, если он авторизован
    const storedUser = localStorage.getItem('quiz_user');
    const userId = storedUser ? JSON.parse(storedUser).id : undefined;

    // Передаем userId вместе с именем
    socket.emit('join-room', { pin, playerName, userId });

    socket.on('error', (msg) => { setError(msg); setStatus('Ошибка'); });
    socket.on('connect', () => setStatus('Вы в игре! Смотрите на главный экран 📺'));

    socket.on('receive-question', (question) => {
      setIsPlaying(true);
      setCurrentQuestion(question);
      setSelectedAnswers([]);
      setIsSubmitted(false);
      setIsShowingResult(false); 
      setCorrectAnswersFromServer([]);
      setTimeLeft(question.timeLimit || 20);
    });

    
    socket.on('show-answer', (correctAnswers) => {
      setCorrectAnswersFromServer(correctAnswers);
      setIsShowingResult(true);
      setTimeLeft(0);
    });

    socket.on('game-over', (leaderboard) => {
      setIsPlaying(false);
      setIsGameOver(true);
      
      const myIndex = leaderboard.findIndex((p: any) => p.name === playerName);
      if (myIndex !== -1) {
        setRank(myIndex + 1);
        setFinalScore(leaderboard[myIndex].score);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [pin, playerName]);

  // ЛОГИКА КЛИКА ПО ОТВЕТУ
  const handleToggleAnswer = (option: string) => {
    if (isSubmitted) return; // Если уже отправили, блокируем нажатия

    if (currentQuestion.type === 'MULTIPLE') {
      // Для MULTIPLE просто добавляем/убираем вариант из массива
      setSelectedAnswers(prev => 
        prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
      );
    } else {
      // Для SINGLE сразу выбираем один ответ и отправляем
      setSelectedAnswers([option]);
      setIsSubmitted(true);
      socket.emit('submit-answer', { pin, playerName, answer: option });
    }
  };

  // Тикающий таймер и автоблокировка
  useEffect(() => {
    if (isPlaying && !isGameOver && timeLeft > 0 && !isSubmitted) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && isPlaying && !isSubmitted) {
      // Время вышло! Блокируем ответы
      setIsSubmitted(true);
    }
  }, [isPlaying, isGameOver, timeLeft, isSubmitted]);

  // Кнопка для ручной отправки MULTIPLE ответов
  const handleSubmitMultiple = () => {
    if (selectedAnswers.length === 0) return;
    setIsSubmitted(true);
    socket.emit('submit-answer', { pin, playerName, answer: selectedAnswers });
  };

  if (error) return <div className="text-red-400 p-8 text-center">{error}</div>;

  // --- ЭКРАН ИТОГОВ ---
  if (isGameOver) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-3xl shadow-2xl text-center w-full max-w-md animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-2">Игра окончена!</h1>
        <p className="text-purple-200 mb-8">Вот ваши результаты:</p>
        
        <div className="bg-purple-900/40 rounded-2xl p-6 mb-6">
          <div className="text-sm text-purple-300 uppercase tracking-widest mb-1">Место</div>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            #{rank}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6">
          <div className="text-sm text-purple-300 uppercase tracking-widest mb-1">Заработано очков</div>
          <div className="text-4xl font-bold text-white">{finalScore}</div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ВОПРОСА ---
  if (isPlaying && currentQuestion) {
    return (
      <div className="w-full max-w-md animate-fade-in-up">
        {}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl mb-6 text-center relative overflow-hidden animate-fade-in-up">
          {currentQuestion.type === 'MULTIPLE' && (
            <div className="absolute top-0 left-0 w-full bg-indigo-600 text-xs font-bold py-1 uppercase tracking-widest">
              Выберите несколько вариантов
            </div>
          )}
          
          {/* Визуальный таймер */}
          <div className={`text-2xl font-black mb-3 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            ⏱ {timeLeft} сек
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {currentQuestion.text}
          </h2>
        </div>

        {/* ВАРИАНТЫ ОТВЕТОВ */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt: string, idx: number) => {
            const isSelected = selectedAnswers.includes(opt);
            const btnStyle = isSelected 
              ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
              : isSubmitted 
                ? 'bg-white/5 border-white/5 text-white/40' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 text-white';

            return (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => handleToggleAnswer(opt)}
                className={`w-full p-4 rounded-2xl border font-bold text-lg transition-all active:scale-95 ${btnStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Кнопка отправки для MULTIPLE вопросов */}
        {currentQuestion.type === 'MULTIPLE' && !isSubmitted && (
          <button
            onClick={handleSubmitMultiple}
            disabled={selectedAnswers.length === 0}
            className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ПОДТВЕРДИТЬ ОТВЕТ
          </button>
        )}

        {isSubmitted && (
          <div className="text-center mt-8 animate-pulse text-purple-300 font-medium">
            {timeLeft === 0 ? 'Время вышло! Ожидайте результатов... ⏳' : 'Ответ принят! Ожидайте результатов... ⏳'}
          </div>
        )}
      </div>
    );
  }

  // --- ЭКРАН ЛОББИ ---
  return (
    <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl text-center w-full max-w-md">
      <h1 className="text-2xl font-bold text-white mb-6">Привет, {playerName}!</h1>
      <p className="text-lg font-medium text-purple-200">{status}</p>
    </div>
  );
}

export default function PlayerRoomPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <Suspense fallback={<div>Загрузка комнаты...</div>}>
        <RoomContent />
      </Suspense>
    </div>
  );
}