import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, imageUrl, type, options, correctAnswers, quizId } = body;

    // Строгая проверка: вариантов должно быть >= 2, и должен быть хотя бы один правильный ответ
    if (!text || !options || !Array.isArray(options) || options.length < 2 || !correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length === 0 || !quizId) {
      return NextResponse.json(
        { message: 'Некорректные данные. Проверьте текст, варианты ответов и правильные ответы.' },
        { status: 400 }
      );
    }

    // Проверяем, что все указанные правильные ответы реально существуют среди вариантов
    const allCorrectAnswersValid = correctAnswers.every(ans => options.includes(ans));
    if (!allCorrectAnswersValid) {
      return NextResponse.json(
        { message: 'Все правильные ответы должны быть в списке предложенных вариантов' },
        { status: 400 }
      );
    }

    const newQuestion = await prisma.question.create({
      data: {
        text,
        imageUrl: imageUrl || null,
        type: type || "SINGLE", // По умолчанию один правильный ответ
        options,
        correctAnswers, // Теперь сохраняем массив!
        quizId,
      },
    });

    return NextResponse.json({
      message: 'Вопрос успешно добавлен!',
      question: newQuestion
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка при добавлении вопроса:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
export async function GET(req: Request) {
  try {
    // Достаем ID квиза из URL
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (!quizId) {
      return NextResponse.json({ message: 'Не указан ID квиза' }, { status: 400 });
    }

    // Ищем все вопросы, привязанные к этому квизу
    const questions = await prisma.question.findMany({
      where: { quizId },
    });

    return NextResponse.json({ questions }, { status: 200 });

  } catch (error) {
    console.error('Ошибка при получении вопросов:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}