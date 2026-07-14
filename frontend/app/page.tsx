'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  
  // Состояние для авторизованного пользователя
  const [authUser, setAuthUser] = useState<{ id: string; name: string } | null>(null);

  // Проверяем, авторизован ли пользователь, при загрузке страницы
  useEffect(() => {
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setAuthUser(parsedUser);
      setName(parsedUser.name); // Автоматически подставляем его реальное имя
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    const finalName = authUser ? authUser.name : name;
    if (!finalName) {
      alert('Пожалуйста, введите ваше имя!');
      return;
    }

    // Перенаправляем игрока в комнату
    router.push(`/room/${pin}?name=${encodeURIComponent(finalName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {}
      <div className="absolute top-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>

      <div className="max-w-md w-full relative z-10 text-center">
        {/* Кнопка перехода в панель управления для организаторов */}
        <div className="absolute -top-16 right-0">
          {authUser ? (
            <Link href="/dashboard" className="px-4 py-2 text-xs font-bold text-purple-300 hover:text-white border border-white/10 bg-white/5 rounded-xl transition-all">
              Личный кабинет 👤
            </Link>
          ) : (
            <Link href="/login" className="px-4 py-2 text-xs font-bold text-purple-300 hover:text-white border border-white/10 bg-white/5 rounded-xl transition-all">
              Вход для ведущих 🔑
            </Link>
          )}
        </div>

        {/* Логотип */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center font-black text-4xl shadow-xl shadow-purple-500/30 mx-auto mb-4 animate-bounce">
            Q
          </div>
          <h1 className="text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200">
            QUIZ.BOOM
          </h1>
          <p className="text-purple-300 text-sm mt-2">Реалтайм викторины для любой компании</p>
        </div>

        {/* Форма подключения */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
          {authUser && (
            <div className="mb-6 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl text-sm text-purple-200">
              Вы вошли как <span className="font-bold text-white">{authUser.name}</span>. 
              Ваши результаты сохранятся в историю!
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-left text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                Код игры (PIN)
              </label>
              <input
                type="text"
                required
                maxLength={4}
                className="w-full text-center text-3xl font-black tracking-[0.2em] px-4 py-4 border border-white/10 rounded-2xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/20"
                placeholder="0000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Только цифры
              />
            </div>

            {/* Скрываем ввод имени, если пользователь уже авторизован */}
            {!authUser && (
              <div className="animate-fade-in-up">
                <label className="block text-left text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                  Ваше имя в игре
                </label>
                <input
                  type="text"
                  required={!authUser}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-purple-300/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center font-bold"
                  placeholder="Например: Георгий"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-white text-indigo-950 font-black rounded-2xl hover:bg-purple-200 transition-all shadow-lg active:scale-95 text-lg"
            >
              ПРИСОЕДИНИТЬСЯ к ИГРЕ ➔
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}