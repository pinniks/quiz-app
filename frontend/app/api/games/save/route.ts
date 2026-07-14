import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { quizId, quizTitle, hostId, leaderboard } = await req.json();

    if (!quizId || !hostId || !leaderboard || !Array.isArray(leaderboard)) {
      return NextResponse.json({ message: 'Неполные данные для сохранения результатов' }, { status: 400 });
    }

    // Создаем запись об игре и вложенные результаты игроков за одну транзакцию!
    const savedGame = await prisma.gameResult.create({
      data: {
        quizId,
        quizTitle,
        hostId,
        players: {
          create: leaderboard.map((player: any, index: number) => ({
            userId: player.userId || null, // Если игрок прислал свой userId, связываем его с аккаунтом
            playerName: player.name,
            score: player.score,
            rank: index + 1 // Место в рейтинге (1, 2, 3...)
          }))
        }
      },
      include: {
        players: true
      }
    });

    return NextResponse.json({ message: 'Результаты игры успешно сохранены!', game: savedGame }, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка сохранения игры:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера', error: error.message }, { status: 500 });
  }
}