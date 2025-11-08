const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connesso'))
    .catch(err => console.error('Errore MongoDB:', err));

// Import Models
const User = require('./models/User');
const Show = require('./models/Shows');

// Middleware Auth
const authMiddleware = async (req, res, next) => {
  // ... resto del codice
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token mancante' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, artistName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name: name || 'Artista',  // ← Default se non c'è
      artistName: artistName || name || 'Artista',  // ← Default
      role: 'artist'
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key_change_me');
    res.json({ token, user: { id: user._id, email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Errore registrazione:', error);  // ← Log per debug
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});
// GET - User corrente
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore' });
  }
});
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch, 'isMatch')
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key_change_me');
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// ==================== SHOW ROUTES ====================

// GET - Lista tutti gli show (con filtri opzionali)
app.get('/api/shows', authMiddleware, async (req, res) => {
  try {
    const { status, featured, genre } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';
    if (genre) filter.genres = genre;

    const shows = await Show.find(filter)
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 });

    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero degli show' });
  }
});

// GET - Singolo show by ID
app.get('/api/shows/:id', authMiddleware, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('createdBy', 'name email');
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }
    res.json(show);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dello show' });
  }
});

// GET - Show by slug (per sito pubblico)
app.get('/api/shows/slug/:slug', async (req, res) => {
  try {
    const show = await Show.findOne({ slug: req.params.slug });
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }
    res.json(show);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dello show' });
  }
});

// POST - Crea nuovo show (solo admin)
app.post('/api/shows', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const show = new Show({
      ...req.body,
      createdBy: req.user._id
    });
    console.log(show, 'show')
    await show.save();
    res.json(show);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Esiste già uno show con questo titolo' });
    }

    res.status(500).json({ error: 'Errore nella creazione dello show' });
  }
});

// PUT - Aggiorna show (solo admin)
app.put('/api/shows/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const show = await Show.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: Date.now() },
        { new: true, runValidators: true }
    );
    console.log(show, 'show')
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    res.json(show);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello show' });
  }
});

// DELETE - Elimina show (solo admin)
app.delete('/api/shows/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    res.json({ message: 'Show eliminato' });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Errore nell\'eliminazione dello show' });
  }
});
// ==================== ARTIST ROUTES ====================

// POST - Artista crea richiesta show
app.post('/api/artist/shows/request', authMiddleware, async (req, res) => {
  try {
    // Verifica che sia un artista
    if (req.user.role !== 'artist') {
      return res.status(403).json({ error: 'Solo gli artisti possono richiedere show' });
    }
    const show = new Show({
      ...req.body,
      createdBy: req.user._id,
      requestStatus: 'pending',
      status: 'inactive',
      featured: false
    });

    await show.save();
    res.json(show);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella creazione della richiesta' });
  }
});

// GET - Artista vede le sue richieste
app.get('/api/artist/shows', authMiddleware, async (req, res) => {
  try {
    const shows = await Show.find({ createdBy: req.user._id })
        .sort({ updatedAt: -1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle richieste' });
  }
});

// ==================== ADMIN: GESTIONE RICHIESTE ====================

// GET - Admin: lista richieste pending
app.get('/api/admin/shows/requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const shows = await Show.find({ requestStatus: 'pending' })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle richieste' });
  }
});

// PUT - Admin: approva richiesta
app.put('/api/admin/shows/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const show = await Show.findByIdAndUpdate(
        req.params.id,
        {
          requestStatus: 'approved',
          status: 'active',
          adminNotes,
          updatedAt: Date.now()
        },
        { new: true }
    ).populate('createdBy', 'name email');

    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    res.json(show);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'approvazione' });
  }
});

// PUT - Admin: rifiuta richiesta
app.put('/api/admin/shows/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({ error: 'Le note sono obbligatorie per il rifiuto' });
    }

    const show = await Show.findByIdAndUpdate(
        req.params.id,
        {
          requestStatus: 'rejected',
          adminNotes,
          updatedAt: Date.now()
        },
        { new: true }
    ).populate('createdBy', 'name email');

    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    res.json(show);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel rifiuto' });
  }
});
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurazione Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'server/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// ==================== UPLOAD ROUTES ====================

// Serve file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// POST - Upload immagine
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    // URL pubblico dell'immagine
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Errore upload:', error);
    res.status(500).json({ error: 'Errore durante l\'upload' });
  }
});

// DELETE - Elimina immagine (opzionale)
app.delete('/api/upload/:filename', authMiddleware, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Immagine eliminata' });
    } else {
      res.status(404).json({ error: 'File non trovato' });
    }
  } catch (error) {
    console.error('Errore eliminazione:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
});
// Health check
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const Episode = require('./models/Episode');

// ==================== EPISODE ROUTES ====================

// GET - Lista episodi (con filtri)
app.get('/api/episodes', authMiddleware, async (req, res) => {
  try {
    const { showId, status } = req.query;
    const filter = {};

    if (showId) filter.showId = showId;
    if (status) filter.status = status;

    // Se artista, mostra solo episodi dei suoi show
    if (req.user.role === 'artist') {
      const userShows = await Show.find({ createdBy: req.user._id }).select('_id');
      filter.showId = { $in: userShows.map(s => s._id) };
    }

    const episodes = await Episode.find(filter)
        .populate('showId', 'title slug')
        .populate('createdBy', 'name email')
        .sort({ airDate: -1 });

    res.json(episodes);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero degli episodi' });
  }
});

// GET - Singolo episodio
app.get('/api/episodes/:id', authMiddleware, async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id)
        .populate('showId', 'title slug artist')
        .populate('createdBy', 'name email');

    if (!episode) {
      return res.status(404).json({ error: 'Episodio non trovato' });
    }

    res.json(episode);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dell\'episodio' });
  }
});

// POST - Crea episodio
app.post('/api/episodes', authMiddleware, async (req, res) => {
  try {
    // Verifica che lo show esista
    const show = await Show.findById(req.body.showId);
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    // Se artista, verifica che sia il proprietario dello show
    if (req.user.role === 'artist' && show.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const episode = new Episode({
      ...req.body,
      createdBy: req.user._id
    });

    await episode.save();

    // Aggiorna contatore episodi nello show
    await Show.findByIdAndUpdate(req.body.showId, {
      $inc: { 'stats.totalEpisodes': 1 }
    });

    res.json(episode);
  } catch (error) {
    console.error('Errore creazione episodio:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'episodio' });
  }
});

// PUT - Aggiorna episodio
app.put('/api/episodes/:id', authMiddleware, async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);

    if (!episode) {
      return res.status(404).json({ error: 'Episodio non trovato' });
    }

    // Verifica permessi
    if (req.user.role === 'artist') {
      const show = await Show.findById(episode.showId);
      if (show.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }
    }

    Object.assign(episode, req.body, { updatedAt: Date.now() });
    await episode.save();

    res.json(episode);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'episodio' });
  }
});

// DELETE - Elimina episodio
app.delete('/api/episodes/:id', authMiddleware, async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);

    if (!episode) {
      return res.status(404).json({ error: 'Episodio non trovato' });
    }

    // Verifica permessi
    if (req.user.role === 'artist') {
      const show = await Show.findById(episode.showId);
      if (show.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }
    }

    await Episode.findByIdAndDelete(req.params.id);

    // Decrementa contatore episodi nello show
    await Show.findByIdAndUpdate(episode.showId, {
      $inc: { 'stats.totalEpisodes': -1 }
    });

    res.json({ message: 'Episodio eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'episodio' });
  }
});

// GET - Episodi pubblici (per sito pubblico, no auth)
app.get('/api/public/shows/:showSlug/episodes', async (req, res) => {
  try {
    const show = await Show.findOne({ slug: req.params.showSlug });
    if (!show) {
      return res.status(404).json({ error: 'Show non trovato' });
    }

    const episodes = await Episode.find({
      showId: show._id,
      status: 'published'
    }).sort({ airDate: -1 });

    res.json(episodes);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero degli episodi' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});