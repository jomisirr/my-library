// server.js – Strong Backend for My Local Library
require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware (security + parsing)
app.use(helmet()); // Security headers
app.use(cors({ origin: 'http://localhost:3000' })); // Allow frontend
app.use(express.json());

// === AUTH MIDDLEWARE ===
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// === ROUTES ===

// 1. REGISTER (create user)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

    const hashedPw = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPw, name }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'User creation failed' });
  }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. GET BOOKS (filtered by user + search/category)
app.get('/api/books', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = { userId: req.user.id };
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { author: { contains: search, mode: 'insensitive' } }];
    if (category) where.category = category;

    const books = await prisma.book.findMany({ where });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// 4. ADD BOOK
app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    const { title, author, category, cover } = req.body;
    if (!title || !author || !category) return res.status(400).json({ error: 'Title, author, category required' });

    const book = await prisma.book.create({
      data: { title, author, category, cover, userId: req.user.id }
    });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// 5. UPDATE BOOK
app.put('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const book = await prisma.book.updateMany({
      where: { id: Number(id), userId: req.user.id },
      data
    });

    if (book.count === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// 6. DELETE BOOK
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.deleteMany({
      where: { id: Number(id), userId: req.user.id }
    });

    if (book.count === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🛡️ Backend running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});