import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'ID пользователя не передан' }, { status: 400 });
  }

  try {
    // Игры, где юзер был Организатором
    const hostedGames = await prisma.gameResult.findMany({
      where: { hostId: userId },
      include: { players: { orderBy: { rank: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    // Игры, где юзер был Участником
    const playedGames = await prisma.playerResult.findMany({
      where: { userId: userId },
      include: { gameResult: true },
      orderBy: { gameResult: { createdAt: 'desc' } }
    });

    return NextResponse.json({ hostedGames, playedGames }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка загрузки истории:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}