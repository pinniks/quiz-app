'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreateQuizPage() {
  const router = useRouter();
    
  const [creatorId, setCreatorId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Общее');
  const [timeLimit, setTimeLimit] = useState(20);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCreatorId(user.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          timeLimit,
          creatorId: creatorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании квиза');
      }

      // После успешного создания возвращаем на дашборд БЕЗ параметров
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4 py-10">
      {}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl -z-10 animate-pulse"></div>

      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl z-10">
        <div className="mb-8">
          <Link href="/dashboard" className="text-purple-300 hover:text-white transition-colors text-sm flex items-center gap-2 mb-4">
            <span>← Вернуться в панель</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Создать новый квиз ✨</h1>
          <p className="text-purple-200 mt-2 text-sm">Настройте основные параметры вашего будущего теста.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-4 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Название квиза <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-purple-300/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Например: Тест на знание JavaScript"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Описание (необязательно)</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-purple-300/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              placeholder="Кратко расскажите, о чем будут вопросы..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Категория</label>
              <select
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#1e1b4b] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Общее">Общее</option>
                <option value="IT и Программирование">IT и Программирование</option>
                <option value="Кино и Искусство">Кино и Искусство</option>
                <option value="Наука">Наука</option>
                <option value="Игры">Игры</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Время на вопрос (сек)</label>
              <input
                type="number"
                min="5"
                max="120"
                required
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 transform active:scale-95 transition-all duration-150 disabled:opacity-50 mt-4"
          >
            {loading ? 'Создаем магию...' : 'Создать квиз'}
          </button>
        </form>
      </div>
    </div>
  );
}