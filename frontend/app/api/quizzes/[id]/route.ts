import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET-запрос: Получение квиза и его вопросов
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const quizId = resolvedParams.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true, 
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: 'Квиз не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quiz }, { status: 200 });

  } catch (error) {
    console.error('Ошибка при загрузке данных для игры:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const quizId = resolvedParams.id;

    if (!quizId) {
      return NextResponse.json({ message: 'ID квиза не передан' }, { status: 400 });
    }

    
    await prisma.question.deleteMany({
      where: { quizId: quizId },
    });

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ message: 'Квиз успешно удален' }, { status: 200 });

  } catch (error: any) {
    console.error('Ошибка удаления квиза:', error);
    return NextResponse.json(
      { message: 'Не удалось удалить квиз' },
      { status: 500 }
    );
  }
}