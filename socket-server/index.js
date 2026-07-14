const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`🟢 Игрок подключился: ${socket.id}`);

  socket.on('create-room', (quizId) => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[pin] = {
      quizId: quizId,
      hostId: socket.id,
      players: [],
      currentCorrectAnswers: [] 
    };

    socket.join(pin);
    console.log(`🏠 Комната ${pin} создана (Квиз: ${quizId})`);
    socket.emit('room-created', pin);
  });

  socket.on('join-room', ({ pin, playerName, userId }) => {
    const room = rooms[pin]; // Находим комнату
    
    if (room) {
      socket.join(pin); // Игрок заходит в комнату
      
      // Добавляем игрока в список
      const player = { id: socket.id, name: playerName, score: 0, userId: userId || null };
      room.players.push(player);
      
      
      io.to(room.hostId).emit('players-updated', room.players);
      
      io.to(pin).emit('players-updated', room.players);
      
      console.log(`Игрок ${playerName} подключился к комнате ${pin}`);
    } else {
      socket.emit('error', 'Комната не найдена!');
    }
  });

  socket.on('start-game', (pin) => {
    io.to(pin).emit('game-started');
  });

  socket.on('send-question', ({ pin, question }) => {
    const room = rooms[pin];
    if (room) {
      // Сервер запоминает правильные ответы перед тем, как разослать вопрос
      room.currentCorrectAnswers = question.correctAnswers || [];
    }

    const safeQuestion = {
      text: question.text,
      options: question.options,
      type: question.type,
      imageUrl: question.imageUrl,
      timeLimit: question.timeLimit
    };
    
    io.to(pin).emit('receive-question', safeQuestion);
  });

  
  socket.on('reveal-answer', (pin) => {
    const room = rooms[pin];
    if (room) {
      // Рассылаем всем в комнате правильные ответы для текущего вопроса
      io.to(pin).emit('show-answer', room.currentCorrectAnswers);
    }
  });

  socket.on('submit-answer', ({ pin, playerName, answer }) => {
    const room = rooms[pin];
    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        
        let isCorrect = false;

        if (Array.isArray(answer)) {
          // Если ответ — это массив (вопрос MULTIPLE)
          // Проверяем, что количество ответов совпадает и каждый из них правильный
          isCorrect = 
            answer.length === room.currentCorrectAnswers.length &&
            answer.every(a => room.currentCorrectAnswers.includes(a));
        } else {
          // Если ответ — это строка (вопрос SINGLE)
          isCorrect = room.currentCorrectAnswers.includes(answer);
        }

        if (isCorrect) {
          player.score += 1000;
        }
      }
      io.to(room.hostId).emit('player-answered', { playerName, answer });
    }
  });

  
  socket.on('end-game', (pin) => {
    const room = rooms[pin];
    if (room) {
      // Сортируем массив игроков по количеству очков
      const leaderboard = [...room.players].sort((a, b) => b.score - a.score);
      // Отправляем финальную таблицу всем в комнате
      io.to(pin).emit('game-over', leaderboard);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Игрок отключился: ${socket.id}`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket-сервер запущен на порту ${PORT}`);
});