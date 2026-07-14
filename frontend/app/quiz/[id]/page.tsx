'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function QuizManagePage() {
  const params = useParams();
  const quizId = params.id as string;

  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('SINGLE');
  const [options, setOptions] = useState(['', '', '', '']);
  // Храним состояние галочек (правильный ответ или нет)
  const [correctFlags, setCorrectFlags] = useState([false, false, false, false]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/questions?quizId=${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  
  const toggleCorrect = (index: number) => {
    if (type === 'SINGLE') {
      // Если тип "Один ответ", сбрасываем остальные галочки
      const newFlags = [false, false, false, false];
      newFlags[index] = true;
      setCorrectFlags(newFlags);
    } else {
      // Если "Несколько ответов", просто переключаем текущую
      const newFlags = [...correctFlags];
      newFlags[index] = !newFlags[index];
      setCorrectFlags(newFlags);
    }
  };

  // Меняем тип вопроса и сбрасываем галочки, чтобы не было путаницы
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCorrectFlags([false, false, false, false]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    // Собираем только непустые варианты и соответствующие им правильные ответы
    const validOptions: string[] = [];
    const finalCorrectAnswers: string[] = [];

    options.forEach((opt, idx) => {
      if (opt.trim() !== '') {
        validOptions.push(opt.trim());
        if (correctFlags[idx]) {
          finalCorrectAnswers.push(opt.trim());
        }
      }
    });

    if (validOptions.length < 2) {
      setIsError(true);
      setMessage('Добавьте минимум 2 варианта ответа!');
      setLoading(false);
      return;
    }

    if (finalCorrectAnswers.length === 0) {
      setIsError(true);
      setMessage('Отметьте хотя бы один правильный ответ галочкой!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageUrl: imageUrl.trim() !== '' ? imageUrl : null,
          type,
          options: validOptions,
          correctAnswers: finalCorrectAnswers, // Отправляем массив!
          quizId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Ошибка при добавлении вопроса');

      setIsError(false);
      setMessage('Вопрос успешно добавлен в базу! 🎉');
      
      // Очищаем форму
      setText('');
      setImageUrl('');
      setOptions(['', '', '', '']);
      setCorrectFlags([false, false, false, false]);
      fetchQuestions();

    } catch (err: any) {
      setIsError(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-purple-300 hover:text-white transition-colors text-sm flex items-center gap-2 mb-8 inline-block">
          <span>← Вернуться в дашборд</span>
        </Link>

        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

          <h1 className="text-3xl font-extrabold mb-2 relative z-10">Добавить вопрос 📝</h1>
          <p className="text-purple-200 mb-8 relative z-10 text-sm">
            Выберите тип, добавьте картинку и просто кликайте по кнопкам рядом с вариантами, чтобы отметить их как правильные.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${isError ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-green-500/20 text-green-200 border border-green-500/50'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Тип вопроса</label>
                <select
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#1e1b4b] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="SINGLE">Один правильный ответ</option>
                  <option value="MULTIPLE">Несколько правильных</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Ссылка на картинку (опционально)</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-purple-300/50 text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Текст вопроса <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                placeholder="Что такое замыкание в JavaScript?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-purple-200">Варианты ответов (отметьте правильные)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCorrect(idx)}
                      className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        correctFlags[idx] 
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                          : 'bg-white/5 border-white/20 text-transparent hover:border-purple-400'
                      }`}
                    >
                      ✓
                    </button>
                    <input
                      type="text"
                      required={idx < 2}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder={`Вариант ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg transform active:scale-95 transition-all duration-150 disabled:opacity-50 mt-4"
            >
              {loading ? 'Сохранение...' : 'Добавить вопрос в базу'}
            </button>
          </form>
        </div>

        {/* Список добавленных вопросов */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            Вопросы в этом квизе
            <span className="bg-white/10 text-purple-300 text-sm py-1 px-3 rounded-full border border-white/10">
              {questions.length}
            </span>
          </h2>

          {isLoadingQuestions ? (
            <div className="text-center py-10 text-purple-300 animate-pulse">Загрузка вопросов...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/20 rounded-2xl bg-white/5 text-purple-200">
              В этом квизе пока нет вопросов.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex gap-4 items-start mb-4">
                    <div className="bg-purple-600/30 text-purple-200 w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white leading-tight mb-1">{q.text}</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-bold bg-white/10 px-2 py-0.5 rounded text-purple-300">
                          {q.type === 'SINGLE' ? 'Один ответ' : 'Несколько ответов'}
                        </span>
                        {q.imageUrl && (
                          <span className="text-[10px] uppercase font-bold bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                            С картинкой
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {q.imageUrl && (
                    <div className="mb-4 pl-12">
                      <img src={q.imageUrl} alt="Question" className="max-h-32 rounded-lg border border-white/10" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                    {q.options.map((opt: string, i: number) => {
                      // Проверяем, есть ли этот вариант в МАССИВЕ правильных ответов
                      const isCorrect = q.correctAnswers && q.correctAnswers.includes(opt);
                      return (
                        <div 
                          key={i} 
                          className={`px-4 py-2 rounded-xl text-sm border ${
                            isCorrect 
                              ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                              : 'bg-white/5 border-white/10 text-purple-200'
                          }`}
                        >
                          {opt}
                          {isCorrect && <span className="ml-2">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}