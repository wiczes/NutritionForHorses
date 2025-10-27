const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  console.log('REQ.BODY:', req.body);
  const db = req.app.locals.db;
  const { allergies = [], goals = [], pasture = "", supplements = [] } = req.body || {};

  let feeds = await db.collection('Pasze').find({}).toArray();

  // 1. Filter allergens
  feeds = feeds.filter(feed =>
    !feed.alergeny?.some(al => allergies.includes(al))
  );

  // 2. Filter based on pasture and goals
  if (
    pasture === "koń nie ma dostępu do trawiastego pastwiska" ||
    goals.includes("nabranie tkanki tłuszczowej")
  ) {
    feeds = feeds.filter(feed => feed.typ === "sieczka" || feed.typ !== "sieczka");
  }

  // 3. Calculate score
  feeds.forEach(feed => {
    let score = 0;
    if (feed.zalecenia && goals.length > 0) {
      score += feed.zalecenia.filter(z => goals.includes(z)).length;
    }
    // todo: points for supplements, score, price
    feed.score = score;
  });

  // 4. Sort feeds by score and price
  feeds.sort((a, b) => b.score - a.score || a.cena - b.cena);

  // 5. Select top recommendations
  res.json({
    najlepsza: feeds[0] || null,
    alternatywa: feeds[1] || null,
    ekonomiczna: feeds.reduce((min, f) => (f.cena < min.cena ? f : min), feeds[0] || null)
  });
});

module.exports = router;