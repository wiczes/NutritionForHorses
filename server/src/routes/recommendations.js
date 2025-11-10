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
  'uspokojenie konia': ['nadpobudliwosc'],
  'dodanie energii': ['ospalosc'],
  'budowa masy mięśniowej': ['budowamiesni'],
  'utrata tkanki tłuszczowej': ['redukcja'],
  'nabranie tkanki tłuszczowej': ['nabraniewagi'],
  'utrzymanie zbilansowanej diety': ['utrzymanie'],
};

const supplementsMapping = {
  'słaba wątroba': ['slabawatroba'],
  'słabe stawy i ścięgna': ['sslabesciegnaistawy'],
  'wzmocnienie zdrowych ścięgien': ['sport', 'wyczynowy'],
  'regeneracja mięśni': ['regeneracjamiesni'],
  'słaba odporność': ['odpornosc'],
  'problemy oddechowe': ['oddechowe'],
  'słabe jelita': ['slabejelita'],
  'wrzody': ['wrzody'],
  'słaby żołądek': ['slabybrzuch'],
  'odpiaszczanie': ['odpiaszczanie'],
  'słabe kopyta': ['slabekopyta'],
  'słaby stan sierści': ['slabasiersc'],
  'koń nerwowy': ['nadpobudliwosc'],
  'klacz nerwowa (w rui)': ['ruja'],
  'wzmożony strach lub stres': ['nadpobudliwosc'],
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

    if (activityLevel === "Wysoki wysiłek (sport wyczynowy)") {
      requiredRecommendations.add('wyczynowy');
    }
    if (activityLevel === "Średni wysiłek (rekreacja, ok. 1 godz. dziennie)") {
      requiredRecommendations.add('zrownowazonaenergia');
    }
    if (activityLevel === "Średni wysiłek (mały sport)") {
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
    const pasze = feeds.filter(f => f.typ == "granulat" || f.typ == "musli");
    const mesze = feeds.filter(f => f.typ == "mesz");
    const suplementy = feeds.filter(f => f.typ == "suplement");

    sieczki.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });
    
    pasze.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });

    mesze.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });
    
    suplementy.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cena || 0) - (b.cena || 0);
    });

    console.log(`Posortowano: ${pasze.length} pasz, ${sieczki.length} sieczek, ${mesze.length} meszy, ${suplementy.length} suplementów`);

    const needsLucerne = pasture === "koń nie ma dostępu do trawiastego pastwiska" ||
                         pasture === "1-3 godziny dziennie" ||
                         wantWeightGain;

    // Selecting recommendations
    const najlepszaPasza = pasze[0] || null;
    const najlepszaSieczka = sieczki[0] || null;
    const najlepszyMesz = mesze[0] || null;
    const najlepszySuplement = suplementy[0] || null;

    const alternatywaPasza = pasze.find((p, idx) => idx > 0 && p.score >= (najlepszaPasza?.score || 0) * 0.8) || pasze[1] || pasze[0] || null;
    const alternatywaSieczka = sieczki.find((s, idx) => s !== najlepszaSieczka && s.score >= (najlepszaSieczka?.score || 0) * 0.8) || sieczki[1] || sieczki[0] || null;
    const alternatywaMesz = mesze.find((m, idx) => m !== najlepszyMesz && m.score >= (najlepszyMesz?.score || 0) * 0.8) || mesze[1] || mesze[0] || null;
    const alternatywaSuplement = suplementy.find((s, idx) => s !== najlepszySuplement && s.score >= (najlepszySuplement?.score || 0) * 0.8) || suplementy[1] || suplementy[0] || null;

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

    const ekonomicznyMesz = mesze
      .filter(m => m.score >= minScoreThreshold)
      .reduce((min, f) => {
        if (!min) return f;
        const minPrice = (min.cena || Infinity) / (min.waga || 1);
        const fPrice = (f.cena || Infinity) / (f.waga || 1);
        return fPrice < minPrice ? f : min;
      }, null) || mesze[0];

    const ekonomicznySuplement = suplementy
      .filter(s => s.score >= minScoreThreshold)
      .reduce((min, f) => {
        if (!min) return f;
        const minPrice = (min.cena || Infinity) / (min.waga || 1);
        const fPrice = (f.cena || Infinity) / (f.waga || 1);
        return fPrice < minPrice ? f : min;
      }, null) || suplementy[0];

    // Calculating monthly costs
    function calculateMonthlyCost(pasza, sieczka, mesz, suplement, horseWeight) {
      let dailyFeedAmount = 0;
      let dailyRoughageAmount = 0;
      let dailyMashAmount = 0;
      let dailySupplementAmount = 0;

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

      if(mesz && mesz.dawkowanie && Array.isArray(mesz.dawkowanie) && mesz.dawkowanie.length > 0) {
        const avgDose = mesz.dawkowanie.reduce((a, b) => a + b, 0) / mesz.dawkowanie.length;
        dailyFeedAmount += avgDose;
      } else {
        dailyMashAmount = horseWeight * 0.002;
      }

      if(suplement && suplement.dawkowanie && Array.isArray(suplement.dawkowanie) && suplement.dawkowanie.length > 0) {
        const avgDose = suplement.dawkowanie.reduce((a, b) => a + b, 0) / suplement.dawkowanie.length;
        dailyFeedAmount += avgDose;
      } else {
        dailySupplementAmount = horseWeight * 0.001;
      }

      const monthlyFeedAmount = dailyFeedAmount * 30;
      const monthlyRoughageAmount = dailyRoughageAmount * 30;
      const monthlyMashAmount = dailyMashAmount * 30;
      const monthlySupplementAmount = dailySupplementAmount * 30;

      const feedPricePerKg = pasza ? (pasza.cena / pasza.waga) : 0;
      const roughagePricePerKg = sieczka ? (sieczka.cena / sieczka.waga) : 0;
      const mashPricePerKg = mesz ? (mesz.cena / mesz.waga) : 0;
      const supplementPricePerKg = suplement ? (suplement.cena / suplement.waga) : 0;

      const monthlyCostFeed = monthlyFeedAmount * feedPricePerKg / 1000;
      const monthlyCostRoughage = monthlyRoughageAmount * roughagePricePerKg / 1000;
      const monthlyCostMash = mesz ? (monthlyMashAmount * mashPricePerKg / 1000) : 0;
      const monthlyCostSupplement = suplement ? (monthlySupplementAmount * supplementPricePerKg / 1000) : 0;

      return {
        dailyFeed: dailyFeedAmount.toFixed(1),
        dailyRoughage: dailyRoughageAmount.toFixed(1),
        dailyMash : dailyMashAmount.toFixed(1),
        dailySupplement : dailySupplementAmount.toFixed(1),
        monthlyCost: Math.round(monthlyCostFeed + monthlyCostRoughage + monthlyCostMash + monthlyCostSupplement)
      };
    }

    const najlepszaCost = calculateMonthlyCost(najlepszaPasza, najlepszaSieczka, najlepszyMesz, najlepszySuplement, weight || 500);
    const alternatywaCost = calculateMonthlyCost(alternatywaPasza, alternatywaSieczka, najlepszyMesz, najlepszySuplement, weight || 500);
    const ekonomicznaCost = calculateMonthlyCost(ekonomicznaPasza, ekonomicznaSieczka, najlepszyMesz, najlepszySuplement, weight || 500);

    // Creating response objects
    const createRecommendation = (pasza, sieczka, mesz, suplement, cost) => ({
      score: Math.round(((pasza?.score || 0) + (sieczka?.score || 0) + (mesz?.score || 0) + (suplement.score || 0)) / 4),
      cena: ((pasza?.cena || 0) + (sieczka?.cena || 0) + (mesz?.score || 0) + (suplement.score || 0)),
      kosztMiesieczny: cost.monthlyCost,
      dzienneDawkowanie: {
        pasza: cost.dailyFeed,
        sieczka: cost.dailyRoughage,
        mesz: cost.dailyMash,
        suplement: cost.dailySupplement
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
        },
        mesz && {
          nazwa: mesz.nazwa,
          zdjecie: mesz.zdjecie,
          dawkowanie: mesz.dawkowanie,
          typ: mesz.typ,
          cena: mesz.cena,
          score: mesz.score
        },
        suplement && {
          nazwa: suplement.nazwa,
          zdjecie: suplement.zdjecie,
          dawkowanie: suplement.dawkowanie,
          typ: suplement.typ,
          cena: suplement.cena,
          score: suplement.score
        }

      ].filter(Boolean)
    });

    res.json({
      najlepsza: createRecommendation(najlepszaPasza, najlepszaSieczka, najlepszyMesz, najlepszySuplement, najlepszaCost),
      alternatywa: createRecommendation(alternatywaPasza, alternatywaSieczka, najlepszyMesz, najlepszySuplement, alternatywaCost),
      ekonomiczna: createRecommendation(ekonomicznaPasza, ekonomicznaSieczka, najlepszyMesz, najlepszySuplement, ekonomicznaCost)
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