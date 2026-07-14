import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Получаем данные от пользователя
    const body = await req.json();
    const { name, email, password } = body;

    //  Проверяем, что ничего не забыли
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Заполните все поля' }, { status: 400 });
    }

    //  Проверяем, нет ли уже такого пользователя в базе
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Пользователь с таким email уже существует' }, { status: 400 });
    }

    //  Шифруем пароль (10 - это сложность шифрования)
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Сохраняем нового пользователя в базу данных
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // Возвращаем успешный ответ (но сам пароль обратно не отдаем ради безопасности)
    return NextResponse.json({ 
      message: 'Пользователь успешно создан!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}