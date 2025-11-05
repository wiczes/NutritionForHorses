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

const aliasRaw = {
  'pszenica': 'pszenica',
  'jęczmień': 'jeczmien',
  'jeczmien': 'jeczmien',
  'owies': 'owies',
  'żyto': 'zyto',
  'zyto': 'zyto',
  'kukurydza': 'kukurydza',
  'orkisz': 'orkisz',
  'rzepak': 'rzepak',
  'slonecznik': 'slonecznik',
  'słonecznik': 'slonecznik',
  'len': 'len',
  'wyslodki buraczane': 'wyslodki',
  'wysłodki buraczane': 'wyslodki',
  'wyslodki': 'wyslodki',
  'soja': 'soja',
  'groch': 'groch',
  'lucerna': 'lucerna',
  'gluten': 'gluten',
  'jablko': 'jablko',
  'jabłko': 'jablko',
  'marchew': 'marchew',
};

const aliasMap = {};
Object.entries(aliasRaw).forEach(([k, v]) => {
  aliasMap[normalize(k)] = v;
});

const goalsMapping = {
  'uspokojenie konia': ['ospalosc'],
  'dodanie energii': ['szybkaenergia', 'sport', 'wyczynowy'],
  'budowa masy mięśniowej': ['budowamiesni', 'sport'],
  'utrata tkanki tłuszczowej': ['redukcja', 'niskocukrowa', 'niskoskrobiowa'],
  'nabranie tkanki tłuszczowej': ['nabraniewagi'],
  'utrzymanie zbilansowanej diety': ['utrzymanie', 'zrownowazonaenergia'],
};

const supplementsMapping = {
  'słaba wątroba': ['odpornosc'],
  'słabe stawy i ścięgna': ['sport', 'senior'],
  'wzmocnienie zdrowych ścięgien': ['sport'],
  'regeneracja mięśni': ['budowamiesni', 'sport'],
  'słaba odporność': ['odpornosc'],
  'problemy oddechowe': ['odpornosc'],
  'słabe jelita': ['slabejelita', 'niskoskrobiowa'],
  'wrzody': ['wrzody', 'niskoskrobiowa', 'niskocukrowa'],
  'słaby żołądek': ['slabybrzuch', 'kwasowosc'],
  'odpiaszczanie': ['slabejelita'],
  'słabe kopyty': ['senior', 'odpornosc'],
  'słaby stan sierści': ['slabasiersc', 'odpornosc'],
  'puchnące nogi': ['sport', 'senior'],
  'koń nerwowy': ['nadpobudliwosc'],
  'klacz nerwowa (w rui)': ['nadpobudliwosc'],
  'wzmożony strach lub stres': ['nadpobudliwosc', 'ospalosc'],
};

router.post('/', async (req, res) => {
  try {
    console.log('REQ.BODY:', req.body);
    const db = req.app.locals.db;
    
    const { 
      allergies = [], 
      goals = [], 
      pasture = "", 
      supplements = [],
      age = 0,
      weight = 0,
      activityLevel = ""
    } = req.body || {};

    // age group determination
    let ageGroup = 'dorosly';
    if (age < 3) ageGroup = 'zrebie';
    else if (age >= 20) ageGroup = 'senior';

    if (activityLevel === "Emeryt") ageGroup = 'senior';
    if (activityLevel === "Źrebię (do 1 roku)") ageGroup = 'zrebie';

    console.log(`Wiek: ${age}, Grupa: ${ageGroup}, Aktywność: ${activityLevel}`);

    // normalization of allergies
    const incoming = (allergies || []).map(normalize);
    const canonicalAllergies = incoming.map(a => aliasMap[a] || a);
    const allergySet = new Set(canonicalAllergies);

    // collecting required recommendations
    let requiredRecommendations = new Set();

    (goals || []).forEach(goal => {
      const mapped = goalsMapping[goal];
      if (mapped) mapped.forEach(r => requiredRecommendations.add(r));
    });

    (supplements || []).forEach(supp => {
      const mapped = supplementsMapping[supp];
      if (mapped) mapped.forEach(r => requiredRecommendations.add(r));
    });

    if (ageGroup === 'zrebie') requiredRecommendations.add('zrebie');
    if (ageGroup === 'senior') requiredRecommendations.add('senior');

    if (activityLevel === "Wysoki wysiłek (sezon startowy)") {
      requiredRecommendations.add('wyczynowy');
      requiredRecommendations.add('sport');
    }
    if (activityLevel === "Średni wysiłek (rekreacja, ok. 1 godz. dziennie)") {
      requiredRecommendations.add('sport');
    }
    if (activityLevel === "Klacz źrebna" || activityLevel === "Klacz w laktacji") {
      requiredRecommendations.add('nabraniewagi');
    }

    console.log('Wymagane zalecenia:', Array.from(requiredRecommendations));

    let feeds = await db.collection('Pasze').find({}).toArray();

    // filtering allergens
    feeds = feeds.filter(feed => {
      const feedAllergens = (feed.alergeny || []).map(normalize);
      return !feedAllergens.some(al => allergySet.has(al));
    });

    console.log(`Po filtrze alergenów: ${feeds.length} pasz`);

    const wantWeightGain = (goals || []).includes("nabranie tkanki tłuszczowej") || 
                           activityLevel === "Klacz źrebna" ||
                           activityLevel === "Klacz w laktacji";
    
    const wantWeightLoss = (goals || []).includes("utrata tkanki tłuszczowej");

    feeds = feeds.filter(feed => {
      const feedZ = (feed.zalecenia || []).map(normalize);
      
      if (wantWeightLoss) {
        if (feedZ.includes('nabraniewagi') || feedZ.includes('budowamiesni')) {
          return false;
        }
      }
      
      if (!wantWeightGain && !(goals || []).includes("budowa masy mięśniowej")) {
        if (feedZ.includes('nabraniewagi') || feedZ.includes('budowamiesni')) {
          return false;
        }
      }

      return true;
    });

    console.log(`Po wykluczeniu: ${feeds.length} pasz`);

    // Scoring
    feeds.forEach(feed => {
      let matchedCount = 0;
      const feedZ = (feed.zalecenia || []).map(normalize);
      
      requiredRecommendations.forEach(req => {
        if (feedZ.includes(normalize(req))) {
          matchedCount++;
        }
      });

      const totalRequired = requiredRecommendations.size || 1;
      feed.score = Math.round((matchedCount / totalRequired) * 100);
      feed.matchedCount = matchedCount;
    });

    const sieczki = feeds.filter(f => f.typ === "sieczka");
    const pasze = feeds.filter(f => f.typ !== "sieczka");

    sieczki.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });
    
    pasze.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });

    console.log(`Posortowano: ${pasze.length} pasz, ${sieczki.length} sieczek`);

    const needsLucerne = pasture === "koń nie ma dostępu do trawiastego pastwiska" ||
                         pasture === "1-3 godziny dziennie" ||
                         wantWeightGain;

    let lucerneSieczka = null;
    if (needsLucerne) {
      lucerneSieczka = sieczki.find(s => 
        !(s.alergeny || []).map(normalize).includes('lucerna') && s.score > 0
      ) || sieczki[0];
    }

    // Selecting recommendations
    const najlepszaPasza = pasze[0] || null;
    const najlepszaSieczka = lucerneSieczka || sieczki[0] || null;

    const alternatywaPasza = pasze.find((p, idx) => idx > 0 && p.score >= (najlepszaPasza?.score || 0) * 0.8) || pasze[1] || pasze[0] || null;
    const alternatywaSieczka = sieczki.find((s, idx) => s !== najlepszaSieczka && s.score >= (najlepszaSieczka?.score || 0) * 0.8) || sieczki[1] || sieczki[0] || null;

    const minScoreThreshold = (najlepszaPasza?.score || 0) * 0.6;
    
    const ekonomicznaPasza = pasze
      .filter(p => p.score >= minScoreThreshold)
      .reduce((min, f) => {
        if (!min) return f;
        const minPrice = (min.cena || Infinity) / (min.waga || 1);
        const fPrice = (f.cena || Infinity) / (f.waga || 1);
        return fPrice < minPrice ? f : min;
      }, null) || pasze[0];

    const ekonomicznaSieczka = sieczki
      .filter(s => s.score >= minScoreThreshold)
      .reduce((min, f) => {
        if (!min) return f;
        const minPrice = (min.cena || Infinity) / (min.waga || 1);
        const fPrice = (f.cena || Infinity) / (f.waga || 1);
        return fPrice < minPrice ? f : min;
      }, null) || sieczki[0];

    // Calculating monthly costs
    function calculateMonthlyCost(pasza, sieczka, horseWeight) {
      let dailyFeedAmount = 0;
      let dailyRoughageAmount = 0;

      if (pasza && pasza.dawkowanie && Array.isArray(pasza.dawkowanie) && pasza.dawkowanie.length > 0) {
        const avgDose = pasza.dawkowanie.reduce((a, b) => a + b, 0) / pasza.dawkowanie.length;
        dailyFeedAmount = avgDose;
      } else {
        dailyFeedAmount = horseWeight * 0.005;
      }

      if (sieczka && sieczka.dawkowanie && Array.isArray(sieczka.dawkowanie) && sieczka.dawkowanie.length > 0) {
        const avgDose = sieczka.dawkowanie.reduce((a, b) => a + b, 0) / sieczka.dawkowanie.length;
        dailyRoughageAmount = avgDose;
      } else {
        dailyRoughageAmount = horseWeight * 0.01;
      }

      const monthlyFeedAmount = dailyFeedAmount * 30;
      const monthlyRoughageAmount = dailyRoughageAmount * 30;

      const feedPricePerKg = pasza ? (pasza.cena / pasza.waga) : 0;
      const roughagePricePerKg = sieczka ? (sieczka.cena / sieczka.waga) : 0;

      const monthlyCostFeed = monthlyFeedAmount * feedPricePerKg / 1000;
      const monthlyCostRoughage = monthlyRoughageAmount * roughagePricePerKg / 1000;

      return {
        dailyFeed: dailyFeedAmount.toFixed(1),
        dailyRoughage: dailyRoughageAmount.toFixed(1),
        monthlyCost: Math.round(monthlyCostFeed + monthlyCostRoughage)
      };
    }

    const najlepszaCost = calculateMonthlyCost(najlepszaPasza, najlepszaSieczka, weight || 500);
    const alternatywaCost = calculateMonthlyCost(alternatywaPasza, alternatywaSieczka, weight || 500);
    const ekonomicznaCost = calculateMonthlyCost(ekonomicznaPasza, ekonomicznaSieczka, weight || 500);

    // Creating response objects
    const createRecommendation = (pasza, sieczka, cost) => ({
      score: Math.round(((pasza?.score || 0) + (sieczka?.score || 0)) / 2),
      cena: ((pasza?.cena || 0) + (sieczka?.cena || 0)),
      kosztMiesieczny: cost.monthlyCost,
      dzienneDawkowanie: {
        pasza: cost.dailyFeed,
        sieczka: cost.dailyRoughage
      },
      items: [
        pasza && {
          nazwa: pasza.nazwa,
          zdjecie: pasza.zdjecie,
          dawkowanie: pasza.dawkowanie,
          typ: pasza.typ,
          cena: pasza.cena,
          score: pasza.score
        },
        sieczka && {
          nazwa: sieczka.nazwa,
          zdjecie: sieczka.zdjecie,
          dawkowanie: sieczka.dawkowanie,
          typ: sieczka.typ,
          cena: sieczka.cena,
          score: sieczka.score
        }
      ].filter(Boolean)
    });

    res.json({
      najlepsza: createRecommendation(najlepszaPasza, najlepszaSieczka, najlepszaCost),
      alternatywa: createRecommendation(alternatywaPasza, alternatywaSieczka, alternatywaCost),
      ekonomiczna: createRecommendation(ekonomicznaPasza, ekonomicznaSieczka, ekonomicznaCost)
    });

  } catch (error) {
    console.error('BŁĄD SERWERA:', error);
    res.status(500).json({ 
      error: 'Błąd serwera', 
      details: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;