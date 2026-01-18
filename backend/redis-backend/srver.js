const express = require('express');
const redis = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const API_URL = 'http://localhost:5000/students';
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to Redis
const client = redis.createClient({
  url: 'redis://@127.0.0.1:6379'  // Default Redis connection
});

client.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis connection error:', err));

// CRUD Operations

// Route to save student data in Redis hash
app.post('/students', async (req, res) => {
  const { id, title, name, suffix, sex, birthday, age, postalCode, citizenship, civilStatus, course, address } = req.body;

  // Validate input fields
  if (!id || !title || !name || !course || !age || !address || !sex || !birthday || !postalCode || !citizenship || !civilStatus) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const studentData = { title, name, suffix, sex, birthday, age, postalCode, citizenship, civilStatus, course, address };
    await client.hSet(`student:${id}`, 'title', studentData.title);
    await client.hSet(`student:${id}`, 'name', studentData.name);
    await client.hSet(`student:${id}`, 'suffix', studentData.suffix);
    await client.hSet(`student:${id}`, 'sex', studentData.sex);
    await client.hSet(`student:${id}`, 'birthday', studentData.birthday);
    await client.hSet(`student:${id}`, 'age', studentData.age);
    await client.hSet(`student:${id}`, 'postalCode', studentData.postalCode);
    await client.hSet(`student:${id}`, 'citizenship', studentData.citizenship);
    await client.hSet(`student:${id}`, 'civilStatus', studentData.civilStatus);
    await client.hSet(`student:${id}`, 'course', studentData.course);
    await client.hSet(`student:${id}`, 'address', studentData.address);

    res.status(201).json({ message: 'Student saved successfully in Redis hash' });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ message: 'Failed to save student' });
  }
});

// Read (R)
app.get('/students/:id', async (req, res) => {
  const id = req.params.id;
  const student = await client.hGetAll(`student:${id}`);
  if (Object.keys(student).length === 0) {
    return res.status(404).json({ message: 'Student not found' });
  }
  res.json(student);
});

// Read all students
app.get('/students', async (_req, res) => {
  const keys = await client.keys('student:*');
  const students = await Promise.all(keys.map(async (key) => {
    return { id: key.split(':')[1], ...(await client.hGetAll(key)) };
  }));
  res.json(students);
});

// Update (U)
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const { title, name, suffix, sex, birthday, age, postalCode, citizenship, civilStatus, course, address } = req.body;

  if (!title && !name && !suffix && !sex && !birthday && !age && !postalCode && !citizenship && !civilStatus && !course && !address) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  try {
    const existingStudent = await client.hGetAll(`student:${id}`);
    if (Object.keys(existingStudent).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (title) await client.hSet(`student:${id}`, 'title', title);
    if (name) await client.hSet(`student:${id}`, 'name', name);
    if (suffix) await client.hSet(`student:${id}`, 'suffix', suffix);
    if(sex) await client.hSet(`student:${id}`, 'sex', sex);
    if (birthday) await client.hSet(`student:${id}`, 'birthday', birthday);
    if (age) await client.hSet(`student:${id}`, 'age', age);
    if (postalCode) await client.hSet(`student:${id}`, 'postalCode', postalCode);
    if (citizenship) await client.hSet(`student:${id}`, 'citizenship', citizenship);
    if (civilStatus) await client.hSet(`student:${id}`, 'civilStatus', civilStatus);
    if (course) await client.hSet(`student:${id}`, 'course', course);
    if (address) await client.hSet(`student:${id}`, 'address', address);
    
    res.status(200).json({ message: 'Student updated successfully in Redis' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete (D)
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  await client.del(`student:${id}`);
  res.status(200).json({ message: 'Student deleted successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
