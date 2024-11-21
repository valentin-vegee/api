const express = require('express');
const etag = require('etag');
const mongoose = require('mongoose');
const Todo = require('./todo');
const authcontroller = require('./controller/authcontroller');
const authenticationMiddleware = require('./middlewares/authJwt');
const express = require('express');
const mongoose = require('mongoose');
const etag = require('etag');
const app = express();

// Configuration des middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/api-todos?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion réussie à MongoDB'))
  .catch((error) => console.error('Échec de la connexion à MongoDB', error));

// Routes pour les tâches (Todos)
app.get('/api/tasks', [authenticationMiddleware.verifyToken, authenticationMiddleware.isExist], async (req, res) => {
  try {
    const tasks = await Todo.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).send('Erreur : Impossible de récupérer les tâches.');
  }
});

app.get('/api/tasks/:taskId', [authenticationMiddleware.verifyToken, authenticationMiddleware.isExist], async (req, res) => {
  try {
    const task = await Todo.findById(req.params.taskId);
    if (!task) {
      return res.status(404).send('Erreur : Tâche non trouvée.');
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).send('Erreur : Échec de la récupération de la tâche.');
  }
});

app.post('/api/tasks', [authenticationMiddleware.verifyToken, authenticationMiddleware.isExist, authenticationMiddleware.hasRole('admin')], async (req, res) => {
  try {
    const task = new Todo({
      title: req.body.title,
      completed: req.body.completed || false,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).send('Erreur : Impossible de créer la tâche.');
  }
});

app.put('/api/tasks/:taskId', [authenticationMiddleware.verifyToken, authenticationMiddleware.isExist, authenticationMiddleware.hasRole('admin')], async (req, res) => {
  try {
    const task = await Todo.findById(req.params.taskId);
    if (!task) {
      return res.status(404).send('Erreur : Tâche introuvable.');
    }

    const receivedETag = req.headers['if-match'];
    const taskETag = etag(JSON.stringify(task));
    if (receivedETag !== taskETag) {
      return res.status(412).send('Erreur : ETag non correspondant.');
    }

    task.title = req.body.title || task.title;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).send('Erreur : Échec de la mise à jour de la tâche.');
  }
});

// Route non sécurisée
app.get('/api/open-access', (req, res) => {
  res.status(200).send('Accessible sans authentification.');
});

// Routes pour l'authentification
const authController = require('./controllers/authController');
app.post('/api/auth/register', authController.signup);
app.post('/api/auth/login', authController.signin);

// Exportation de l'application
module.exports = app;
