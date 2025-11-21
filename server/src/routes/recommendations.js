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
  'owies': 'owies',
  'żyto': 'zyto',
  'kukurydza': 'kukurydza',
  'orkisz': 'orkisz',
  'rzepak': 'rzepak',
  'słonecznik': 'slonecznik',
  'len': 'len',
  'wysłodki buraczane': 'wyslodki',
  'soja': 'soja',
  'groch': 'groch',
  'lucerna': 'lucerna',
  'gluten': 'gluten',
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
  'wzmocnienie wątroby': ['slabawatroba'],
  'słabe lub kontuzjowane ścięgna i stawy': ['slabesciegnaistawy'],
  'wzmocnienie zdrowych ścięgien': ['sport', 'wyczynowy'],
  'regeneracja mięśni': ['regeneracjamiesni'],
  'wzmocnienie odporności': ['odpornosc'],
  'problemy oddechowe': ['oddechowe'],
  'wzmocnienie jelit': ['slabejelita'],
  'wrzody żołądka': ['wrzody'],
  'wzmocnienie żołądka': ['slabybrzuch'],
  'kwasowość żołądka': ['kwasowosc'],
  'odpiaszczanie': ['odpiaszczanie'],
  'wzmocnienie kopyt': ['slabekopyta'],
  'brak połysku sierści': ['slabasiersc'],
  'wzmocnienie zębów': ['slabezeby'],
  'odstraszenie owadów': ['owady'],
  'koń nerwowy': ['nadpobudliwosc'],
  'klacz nerwowa podczas rui': ['ruja'],
  'wzmożony strach lub stres': ['nerwowe', 'plochliwe'],
};

const basicInfoMapping = {
  'Niski wysiłek (koń na pastwisku)': ['utrzymanie', 'zrownowazonaenergia'],
  'Średni wysiłek (rekreacja, ok. 1 godz. dziennie)': ['utrzymanie'],
  'Średni wysiłek (mały sport)': ['sport', 'elektrolit'],
  'Wysoki wysiłek (sport wyczynowy)': ['wyczynowy', 'elektrolit'],
  'Klacz źrebna': ['ciaza'],
  'Klacz w laktacji': ['laktacja'],
  'Źrebię': ['zrebie'],
  'Emeryt': ['senior'],
  'Ogier kryjący': ['ogierkryjacy'],
  'Koń kontuzjowany': ['kontuzjowany'],
};

function calculateMonthlyCost(pasza, sieczka, mesz, suplement, horseWeight) {
    horseWeight = horseWeight || 500;

    let dailyFeedAmount = 0;
    let dailyRoughageAmount = 0;
    let dailyMashAmount = 0;
    let dailySupplementAmount = 0;

    const getDailyDoseInKG = (product) => {
        if (!product || !product.dawkowanie || !Array.isArray(product.dawkowanie) || product.dawkowanie.length === 0) {
            return 0;
        }

        const sumDose = product.dawkowanie.reduce((a, b) => a + b, 0);
        const avgDoseInGrams = sumDose / product.dawkowanie.length;

        let finalDailyGrams = 0;

        if (product.kalkulowac_dawke === 'tak') {
            finalDailyGrams = avgDoseInGrams * (horseWeight / 100.0);
        } else {
            finalDailyGrams = avgDoseInGrams;
        }

        return finalDailyGrams / 1000.0;
    };

    dailyFeedAmount = getDailyDoseInKG(pasza);
    dailyRoughageAmount = getDailyDoseInKG(sieczka);
    dailyMashAmount = getDailyDoseInKG(mesz);
    dailySupplementAmount = getDailyDoseInKG(suplement);

    const monthlyFeedAmount = dailyFeedAmount * 30;
    const monthlyRoughageAmount = dailyRoughageAmount * 30;
    const monthlyMashAmount = dailyMashAmount * 30;
    const monthlySupplementAmount = dailySupplementAmount * 30;

    const feedPricePerKg = pasza ? (pasza.cena / (pasza.waga || 1)) : 0;
    const roughagePricePerKg = sieczka ? (sieczka.cena / (sieczka.waga || 1)) : 0;
    const mashPricePerKg = mesz ? (mesz.cena / (mesz.waga || 1)) : 0;
    const supplementPricePerKg = suplement ? (suplement.cena / (suplement.waga || 1)) : 0;

    const monthlyCostFeed = monthlyFeedAmount * feedPricePerKg;
    const monthlyCostRoughage = monthlyRoughageAmount * roughagePricePerKg;
    const monthlyCostMash = monthlyMashAmount * mashPricePerKg;
    const monthlyCostSupplement = monthlySupplementAmount * supplementPricePerKg;

    return {
        dailyFeed: dailyFeedAmount.toFixed(2),
        dailyRoughage: dailyRoughageAmount.toFixed(2),
        dailyMash: dailyMashAmount.toFixed(2),
        dailySupplement: dailySupplementAmount.toFixed(3),
        monthlyCost: Math.round(monthlyCostFeed + monthlyCostRoughage + monthlyCostMash + monthlyCostSupplement)
    };
}

router.post('/', async (req, res) => {
  try {
    console.log('REQ.BODY:', req.body);
    const db = req.app.locals.db;
    
    const { 
      allergies = [], 
      goals = [], 
      pasture = [], 
      supplements = [],
      age = 0,
      weight = 0,
      workload = []
    } = req.body || {};

    let ageGroup = 'dorosly';
    if (age < 3) ageGroup = 'zrebie';
    else if (age >= 20) ageGroup = 'senior';

    if (workload === "Emeryt") ageGroup = 'senior';
    if (workload === "Źrebię") ageGroup = 'zrebie';

    console.log(`Wiek: ${age}, Grupa: ${ageGroup}, Aktywność: ${workload}`);

    const incoming = (allergies || []).map(normalize);
    const canonicalAllergies = incoming.map(a => aliasMap[a] || a);
    const allergySet = new Set(canonicalAllergies);

    let primaryReq = new Set();
    let secondaryReq = new Set();

    (supplements || []).forEach(supp => {
      const mapped = supplementsMapping[supp];
      if (mapped) {
          mapped.forEach(r => {
              secondaryReq.add(r);
          });
      }
    });

    (goals || []).forEach(goal => {
      const mapped = goalsMapping[goal];
      if (mapped) mapped.forEach(r => primaryReq.add(r));
    });

    const workloadArray = Array.isArray(workload) ? workload : [workload];

    workloadArray.forEach(level => {
      if (!level) return; 
      const mapped = basicInfoMapping[level];
      if (mapped) {
          mapped.forEach(r => primaryReq.add(r));
      }
    });

    if (ageGroup === 'zrebie') primaryReq.add('zrebie');
    if (ageGroup === 'senior') primaryReq.add('senior');

    console.log('Wymagane (Primary):', Array.from(primaryReq));
    console.log('Dodatkowe (Secondary):', Array.from(secondaryReq));

    let feeds = await db.collection('Pasze').find({}).toArray();

    feeds = feeds.filter(feed => {
      const feedAllergens = (feed.alergeny || []).map(normalize);
      return !feedAllergens.some(al => allergySet.has(al));
    });

    const wantWeightGain = (goals || []).includes("nabranie tkanki tłuszczowej") || 
                           workload === "Klacz źrebna" ||
                           workload === "Klacz w laktacji";
    const wantWeightLoss = (goals || []).includes("utrata tkanki tłuszczowej");

    feeds = feeds.filter(feed => {
      const feedZ = (feed.zalecenia || []).map(normalize);
      if (wantWeightLoss) {
        if (feedZ.includes('nabraniewagi') || feedZ.includes('budowamiesni')) return false;
      }
      if (!wantWeightGain && !(goals || []).includes("budowa masy mięśniowej")) {
        if (feedZ.includes('nabraniewagi') || feedZ.includes('budowamiesni')) return false;
      }
      return true;
    });

    console.log(`Po filtrach logicznych: ${feeds.length} pasz`);

    feeds.forEach(feed => {
      const feedZ = (feed.zalecenia || []).map(normalize);
      
      let primaryMatches = 0;
      primaryReq.forEach(req => {
        if (feedZ.includes(normalize(req))) {
          primaryMatches++;
        }
      });

      const totalPrimary = primaryReq.size;
      
      let baseScore = 0;
      if (totalPrimary > 0) {
        baseScore = (primaryMatches / totalPrimary) * 100;
      } else {
        baseScore = 100;
      }

      let secondaryMatches = 0;
      secondaryReq.forEach(req => {
        if (feedZ.includes(normalize(req))) {
          secondaryMatches++;
        }
      });

      const bonusPoints = secondaryMatches * 10;

      feed.score = Math.round(baseScore + bonusPoints);
      
      feed.matchedCount = primaryMatches + secondaryMatches; 
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

    // Selecting recommendations
    // best choice
    const najlepszaPasza = pasze[0] || null;
    const najlepszaSieczka = sieczki[0] || null;
    const najlepszyMesz = mesze[0] || null;
    const najlepszySuplement = suplementy[0] || null;

    // second best choice
    const alternatywaPasza = pasze[1] || najlepszaPasza;
    const alternatywaSieczka = sieczki[1] || najlepszaSieczka;
    const alternatywaMesz = mesze[1] || najlepszyMesz;
    const alternatywaSuplement = suplementy[1] || najlepszySuplement;

    // cheaper choice
    const findEkonomiczny = (list, best, alt, minScore) => {
      const uzyteNazwy = new Set([best?.nazwa, alt?.nazwa].filter(Boolean));
      

      const kandydaci = list.filter(p => p.score >= minScore && !uzyteNazwy.has(p.nazwa));
      
      // 3. choosing the cheapest
      const ekonomiczny = kandydaci.reduce((min, f) => {
          if (!min) return f;
          const minPrice = (min.cena || Infinity) / (min.waga || 1);
          const fPrice = (f.cena || Infinity) / (f.waga || 1);
          return fPrice < minPrice ? f : min;
      }, null);

      // choices and fallback
      if (ekonomiczny) return ekonomiczny;
      if (list[2]) return list[2];
      if (alt) return alt;
  
      return best;
    };

    const minScorePasza = (najlepszaPasza?.score || 0) * 0.6;
    const ekonomicznaPasza = findEkonomiczny(pasze, najlepszaPasza, alternatywaPasza, minScorePasza);

    const minScoreSieczka = (najlepszaSieczka?.score || 0) * 0.6;
    const ekonomicznaSieczka = findEkonomiczny(sieczki, najlepszaSieczka, alternatywaSieczka, minScoreSieczka);

    const minScoreMesz = (najlepszyMesz?.score || 0) * 0.6;
    const ekonomicznyMesz = findEkonomiczny(mesze, najlepszyMesz, alternatywaMesz, minScoreMesz);
    
    const minScoreSuplement = (najlepszySuplement?.score || 0) * 0.6;
    const ekonomicznySuplement = findEkonomiczny(suplementy, najlepszySuplement, alternatywaSuplement, minScoreSuplement);

    // Calculate monthly cost
    const najlepszaCost = calculateMonthlyCost(najlepszaPasza, najlepszaSieczka, najlepszyMesz, najlepszySuplement, weight || 500);
    const alternatywaCost = calculateMonthlyCost(alternatywaPasza, alternatywaSieczka, alternatywaMesz, alternatywaSuplement, weight || 500);
    const ekonomicznaCost = calculateMonthlyCost(ekonomicznaPasza, ekonomicznaSieczka, ekonomicznyMesz, ekonomicznySuplement, weight || 500);

    // Creating response objects
    const createRecommendation = (pasza, sieczka, mesz, suplement, cost) => ({
      score: Math.round(((pasza?.score || 0) + (sieczka?.score || 0) + (mesz?.score || 0) + (suplement?.score || 0)) / 4), // Zmieniono suplement.score
      cena: ((pasza?.cena || 0) + (sieczka?.cena || 0) + (mesz?.cena || 0) + (suplement?.cena || 0)), // Zmieniono mesz.score i suplement.score na .cena
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
      alternatywa: createRecommendation(alternatywaPasza, alternatywaSieczka, alternatywaMesz, alternatywaSuplement, alternatywaCost),
      ekonomiczna: createRecommendation(ekonomicznaPasza, ekonomicznaSieczka, ekonomicznyMesz, ekonomicznySuplement, ekonomicznaCost)
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