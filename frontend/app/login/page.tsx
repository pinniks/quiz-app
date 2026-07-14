'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Неверный логин или пароль');
      }

      
      localStorage.setItem('quiz_user', JSON.stringify({
        id: data.user.id,
        name: data.user.name
      }));

      // Перенаправляем на Dashboard (без параметров в ссылке)
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 sm:px-6 lg:px-8">
      {/* Светящиеся шары на фоне */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Войти в систему
          </h2>
          <p className="mt-2 text-center text-sm text-purple-200">
            Или{' '}
            <Link href="/register" className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200 underline">
              зарегистрируйте новый аккаунт
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Email адрес</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Пароль</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r
              from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-900 focus:ring-purple-500 shadow-lg transform active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}