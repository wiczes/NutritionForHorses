const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  const feeds = await db.collection('Pasze').find({}).toArray();
  console.log('Zwracam pasze:', feeds); 
  res.json(feeds);
});

module.exports = router;