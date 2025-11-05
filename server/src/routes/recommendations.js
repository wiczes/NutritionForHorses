const express = require('express');
const router = express.Router();

function normalize(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// raw alias mapping: frontend variants -> canonical DB value
const aliasRaw = {
  // zboza
  'pszenica': 'pszenica',
  'jęczmień': 'jeczmien',
  'jeczmien': 'jeczmien',
  'owies': 'owies',
  'żyto': 'zyto',
  'zyto': 'zyto',
  'kukurydza': 'kukurydza',
  'orkisz': 'orkisz',
  'rzepak': 'rzepak',

  // rosliny / inne
  'slonecznik': 'slonecznik',
  'słonecznik': 'slonecznik',
  'len': 'len',
  'wyslodki buraczane': 'wyslodki',
  'wysłodki buraczane': 'wyslodki',
  'wyslodki': 'wysłodki buraczane',
  'soja': 'soja',
  'groch': 'groch',
  'lucerna': 'lucerna',
  'gluten': 'gluten',
};

// build normalized alias map for fast lookup
const aliasMap = {};
Object.entries(aliasRaw).forEach(([k, v]) => {
  aliasMap[normalize(k)] = v; // store canonical (v) as-is (DB expected form)
});

router.post('/', async (req, res) => {
  console.log('REQ.BODY:', req.body);
  const db = req.app.locals.db;
  const { allergies = [], goals = [], pasture = "", supplements = [] } = req.body || {};

  // normalize incoming allergies and map aliases to canonical DB values
  const incoming = (allergies || []).map(normalize);
  const canonicalAllergies = incoming.map(a => aliasMap[a] || a); // fallback to normalized value
  const allergySet = new Set(canonicalAllergies);

  let feeds = await db.collection('Pasze').find({}).toArray();

  // 1. Filter allergens (canonical comparison)
  feeds = feeds.filter(feed => {
    const feedAllergens = (feed.alergeny || []).map(normalize); // feed values normalized
    // if any feed allergen is in allergySet -> exclude
    return !feedAllergens.some(al => allergySet.has(al));
  });

  // 2. Filter based on pasture and goals (example rule)
  if (
    pasture === "koń nie ma dostępu do trawiastego pastwiska" ||
    (goals || []).includes("nabranie tkanki tłuszczowej")
  ) {
    // prefer sieczki but keep others (this is placeholder; refine rules later)
    feeds = feeds.filter(feed => feed.typ === "sieczka" || feed.typ !== "sieczka");
  }

  // 3. Calculate score
  feeds.forEach(feed => {
    let score = 0;
    if (feed.zalecenia && (goals || []).length > 0) {
      const feedZ = (feed.zalecenia || []).map(normalize);
      const goalsNorm = (goals || []).map(normalize);
      score += feedZ.filter(z => goalsNorm.includes(z)).length;
    }
    // todo: add points for supplements, price, type matching
    feed.score = score;
  });

  // 4. Sort feeds by score and price
  feeds.sort((a, b) => b.score - a.score || (a.cena || 0) - (b.cena || 0));

  // 5. Select top recommendations
  res.json({
    najlepsza: feeds[0] || null,
    alternatywa: feeds[1] || null,
    ekonomiczna: feeds.reduce((min, f) => (f && f.cena < (min?.cena || Infinity) ? f : min), feeds[0] || null)
  });
});

module.exports = router;