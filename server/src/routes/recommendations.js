const express = require('express');
const router = express.Router();

const {
  normalize,
  aliasMap,
  goalsMapping,
  supplementsMapping,
  basicInfoMapping
} = require('./mapping');

const { calculateMonthlyCost } = require('./costs');
const { pickSmartSupplements, findEkonomiczny } = require('./selectors');

router.post('/', async (req, res) => {
  try {
    console.log('REQ.BODY:', req.body);
    const db = req.app.locals.db;
    
    const { 
      allergies = [], 
      goals = [], 
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
    
    let specificSupplementTags = new Set(); 
    (supplements || []).forEach(supp => {
      const mapped = supplementsMapping[supp];
      if (mapped) {
          mapped.forEach(r => {
              secondaryReq.add(r);   
              specificSupplementTags.add(r);
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

    const forceElectrolyteWorkload = [
      'Średni wysiłek (mały sport)', 
      'Wysoki wysiłek (sport wyczynowy)', 
      'Klacz źrebna', 
      'Klacz w laktacji', 
      'Źrebię', 
      'Emeryt', 
      'Ogier kryjący'
    ];
    
    const forceElectrolyteHealth = [
      'wzmocnienie jelit', 
      'wrzody żołądka', 
      'wzmocnienie żołądka'
    ];

    const wList = Array.isArray(workload) ? workload : [workload];
    
    const needsElectrolytes = 
        wList.some(w => forceElectrolyteWorkload.includes(w)) || 
        (supplements || []).some(s => forceElectrolyteHealth.includes(s));

    if (needsElectrolytes) {
        specificSupplementTags.add('elektrolit');
        secondaryReq.add('elektrolit'); 
    }

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
        baseScore = 50 + ((primaryMatches / totalPrimary) * 50);
      } else {
        baseScore = 100;
      }

      let specificSuppMatches = 0;
      if (specificSupplementTags.size > 0) {
          specificSupplementTags.forEach(tag => {
              if (feedZ.includes(normalize(tag))) {
                  specificSuppMatches++;
              }
          });
      }
      feed.specificSuppMatches = specificSuppMatches;

      let secondaryMatches = 0;
      secondaryReq.forEach(req => {
        if (feedZ.includes(normalize(req))) {
          secondaryMatches++;
        }
      });

      const bonusPoints = secondaryMatches * 5; 
      let calculatedScore = baseScore + bonusPoints;
      if (calculatedScore > 100) calculatedScore = 100;

      feed.score = Math.round(calculatedScore);
      feed.matchedCount = primaryMatches + secondaryMatches; 
    });
    
    const sieczki = feeds.filter(f => f.typ === "sieczka");
    const pasze = feeds.filter(f => f.typ == "granulat" || f.typ == "musli");
    const mesze = feeds.filter(f => f.typ == "mesz");
    
    let allSuplements = feeds.filter(f => f.typ == "suplement");

    const sortLogic = (a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.cena || 0) - (b.cena || 0);
    };

    sieczki.sort(sortLogic);
    pasze.sort(sortLogic);
    mesze.sort(sortLogic);
    
    allSuplements.sort((a, b) => {
        if (b.specificSuppMatches !== a.specificSuppMatches) {
            return b.specificSuppMatches - a.specificSuppMatches;
        }
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return (a.cena || 0) - (b.cena || 0);
    });

    console.log(`Posortowano: ${pasze.length} pasz, ${sieczki.length} sieczek, ${mesze.length} meszy, ${allSuplements.length} suplementów`);

    const najlepszaPasza = pasze[0] || null;
    const najlepszaSieczka = sieczki[0] || null;
    const najlepszyMesz = mesze[0] || null;
    const najlepszeSuplementy = pickSmartSupplements(allSuplements, specificSupplementTags);

    const alternatywaPasza = pasze[1] || najlepszaPasza;
    const alternatywaSieczka = sieczki[1] || najlepszaSieczka;
    const alternatywaMesz = mesze[1] || najlepszyMesz;
    
    const usedSuppIds = new Set(najlepszeSuplementy.map(s => s._id.toString()));
    const unusedSupplements = allSuplements.filter(s => !usedSuppIds.has(s._id.toString()));
    const alternatywneSuplementy = pickSmartSupplements(unusedSupplements.length > 0 ? unusedSupplements : allSuplements, specificSupplementTags);

    const minScorePasza = (najlepszaPasza?.score || 0) * 0.6;
    const ekonomicznaPasza = findEkonomiczny(pasze, najlepszaPasza, alternatywaPasza, minScorePasza);

    const minScoreSieczka = (najlepszaSieczka?.score || 0) * 0.6;
    const ekonomicznaSieczka = findEkonomiczny(sieczki, najlepszaSieczka, alternatywaSieczka, minScoreSieczka);

    const minScoreMesz = (najlepszyMesz?.score || 0) * 0.6;
    const ekonomicznyMesz = findEkonomiczny(mesze, najlepszyMesz, alternatywaMesz, minScoreMesz);
    
    const cheapSupplementsList = [...allSuplements].sort((a, b) => {
        if (b.specificSuppMatches !== a.specificSuppMatches) return b.specificSuppMatches - a.specificSuppMatches;
        const priceA = (a.cena || Infinity) / (a.waga || 1);
        const priceB = (b.cena || Infinity) / (b.waga || 1);
        return priceA - priceB;
    });
    const ekonomiczneSuplementy = pickSmartSupplements(cheapSupplementsList, specificSupplementTags);

    const najlepszaCost = calculateMonthlyCost(najlepszaPasza, najlepszaSieczka, najlepszyMesz, najlepszeSuplementy, weight || 500);
    const alternatywaCost = calculateMonthlyCost(alternatywaPasza, alternatywaSieczka, alternatywaMesz, alternatywneSuplementy, weight || 500);
    const ekonomicznaCost = calculateMonthlyCost(ekonomicznaPasza, ekonomicznaSieczka, ekonomicznyMesz, ekonomiczneSuplementy, weight || 500);

    const calculateSingleDoseGrams = (product, horseWeight) => {
        if (!product || !product.dawkowanie || !Array.isArray(product.dawkowanie) || product.dawkowanie.length === 0) {
            return 0;
        }
        const avgDose = product.dawkowanie.reduce((a, b) => a + b, 0) / product.dawkowanie.length;
        
        let finalGrams = 0;
        if (product.kalkulowac_dawke === 'tak') {
            finalGrams = avgDose * ((horseWeight || 500) / 100.0);
        } else {
            finalGrams = avgDose;
        }
        return Math.round(finalGrams);
    };

    const createRecommendation = (pasza, sieczka, mesz, supplementsList, cost) => {
        
        const baseItems = [pasza, sieczka, mesz].filter(item => item !== null && item !== undefined);
        
        let sumBaseScore = 0;
        baseItems.forEach(item => sumBaseScore += (item.score || 0));
        
        const finalScore = baseItems.length > 0 
            ? Math.round(sumBaseScore / baseItems.length) 
            : 0;

        let supplementsPrice = 0;
        supplementsList.forEach(s => {
            supplementsPrice += (s.cena || 0);
        });

        const totalPrice = (pasza?.cena || 0) + (sieczka?.cena || 0) + (mesz?.cena || 0) + supplementsPrice;

        let items = [];
        
        const getDoseInGrams = (item) => {
            if (!item || !item.dawkowanie || item.dawkowanie.length === 0) return 0;
            const avg = item.dawkowanie.reduce((a, b) => a + b, 0) / item.dawkowanie.length;
            
            const currentWeight = weight || 500; 
            
            if (item.kalkulowac_dawke === 'tak') {
                return Math.round(avg * (currentWeight / 100));
            } else {
                return Math.round(avg);
            }
        };

        const addItem = (item, role) => {
            if (item) {
                items.push({
                    ...item, 
                    role: role,
                    wyliczonaDawka: getDoseInGrams(item)
                });
            }
        };

        addItem(pasza, 'pasza');
        addItem(sieczka, 'sieczka');
        addItem(mesz, 'mesz');
        
        supplementsList.forEach(s => {
            addItem(s, 'suplement');
        });

        return {
            score: finalScore,
            cena: totalPrice,
            kosztMiesieczny: cost.monthlyCost,
            dzienneDawkowanie: {
                pasza: cost.dailyFeed,
                sieczka: cost.dailyRoughage,
                mesz: cost.dailyMash,
                suplement: cost.dailySupplement 
            },
            items: items.map(item => ({
                nazwa: item.nazwa,
                zdjecie: item.zdjecie,
                dawkowanie: item.dawkowanie, 
                wyliczonaDawka: item.wyliczonaDawka,
                typ: item.typ,
                cena: item.cena,
                score: item.score,
                zalecenia: item.zalecenia 
            }))
        };
    };

    res.json({
      najlepsza: createRecommendation(najlepszaPasza, najlepszaSieczka, najlepszyMesz, najlepszeSuplementy, najlepszaCost),
      alternatywa: createRecommendation(alternatywaPasza, alternatywaSieczka, alternatywaMesz, alternatywneSuplementy, alternatywaCost),
      ekonomiczna: createRecommendation(ekonomicznaPasza, ekonomicznaSieczka, ekonomicznyMesz, ekonomiczneSuplementy, ekonomicznaCost)
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