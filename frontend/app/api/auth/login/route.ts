import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Получаем данные из запроса
    const body = await req.json();
    const { email, password } = body;

    // 2. Проверяем, что поля не пустые
    if (!email || !password) {
      return NextResponse.json({ message: 'Введите email и пароль' }, { status: 400 });
    }

    // 3. Ищем пользователя в базе данных по email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Если такого пользователя нет
    if (!user) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }

    // 4. Сравниваем введенный пароль с зашифрованным в базе
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Неверный пароль' }, { status: 401 });
    }

    // 5. Успешный вход (Сам пароль обратно не отправляем)
    return NextResponse.json({ 
      message: 'Успешный вход!',
      user: { id: user.id, name: user.name, email: user.email }
    }, { status: 200 });

  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}