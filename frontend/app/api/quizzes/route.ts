import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, timeLimit, creatorId } = body;

    if (!title || !creatorId) {
      return NextResponse.json(
        { message: 'Название квиза и ID создателя обязательны' },
        { status: 400 }
      );
    }

    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        description,
        category: category || "Общее", // Если категорию не передали, ставим дефолтную
        timeLimit: timeLimit ? parseInt(timeLimit) : 20, // Парсим в число, дефолт 20 сек
        creatorId,
      },
    });

    return NextResponse.json({
      message: 'Квиз успешно создан!',
      quiz: newQuiz
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка при создании квиза:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
export async function GET(req: Request) {
  try {
    //Достаем ID пользователя из URL
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ message: 'Не указан ID создателя' }, { status: 400 });
    }

    // Ищем все квизы этого пользователя в базе
    const quizzes = await prisma.quiz.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });

    // Возвращаем список
    return NextResponse.json({ quizzes }, { status: 200 });

  } catch (error) {
    console.error('Ошибка при получении квизов:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}