const { calculateMonthlyCost } = require('../src/routes/costs'); 

const normalize = (str) => {
    if (!str) return "";
    return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

const filterAllergens = (feed, userAllergies) => {
    const allergySet = new Set(userAllergies.map(normalize));
    const feedAllergens = (feed.alergeny || []).map(normalize);
    return !feedAllergens.some(al => allergySet.has(al));
};

const calculateScore = (feed, primaryReq, secondaryReq) => {
    const feedZ = (feed.zalecenia || []).map(normalize);
    
    let primaryMatches = 0;
    primaryReq.forEach(req => {
        if (feedZ.includes(normalize(req))) primaryMatches++;
    });

    const totalPrimary = primaryReq.size;
    let baseScore = 0;
    if (totalPrimary > 0) {
        baseScore = 50 + ((primaryMatches / totalPrimary) * 50);
    } else {
        baseScore = 100;
    }

    let secondaryMatches = 0;
    secondaryReq.forEach(req => {
        if (feedZ.includes(normalize(req))) secondaryMatches++;
    });

    const bonusPoints = secondaryMatches * 5;
    let calculatedScore = baseScore + bonusPoints;
    if (calculatedScore > 100) calculatedScore = 100;
    
    return Math.round(calculatedScore);
};

function pickSmartSupplements(availableList, requiredTags) {
    if (!Array.isArray(availableList) || requiredTags.size === 0) return [];
    let selection = [];
    let coveredTags = new Set();

    for (const supp of availableList) {
        if (selection.length >= 5) break;
        const suppTags = (supp.zalecenia || []).map(t => normalize(t));
        let offersNewValue = false;
        let matchesAnyNeed = false;

        requiredTags.forEach(reqTag => {
            const normReq = normalize(reqTag);
            if (suppTags.includes(normReq)) {
                matchesAnyNeed = true;
                if (!coveredTags.has(normReq)) offersNewValue = true;
            }
        });

        if ((selection.length === 0 && matchesAnyNeed) || offersNewValue) {
            selection.push(supp);
            suppTags.forEach(t => {
                if (requiredTags.has(t)) coveredTags.add(t);
            });
        }
        let allDone = true;
        requiredTags.forEach(t => { if (!coveredTags.has(normalize(t))) allDone = false; });
        if (allDone) break;
    }
    return selection;
}

function findEkonomiczny(list, best, alt, minScore) {
    const uzyteNazwy = new Set([best?.nazwa, alt?.nazwa].filter(Boolean));
    const kandydaci = list.filter(p => p.score >= minScore && !uzyteNazwy.has(p.nazwa));
    
    const ekonomiczny = kandydaci.reduce((min, f) => {
        if (!min) return f;
        const minPrice = (min.cena || Infinity) / (min.waga || 1);
        const fPrice = (f.cena || Infinity) / (f.waga || 1);
        return fPrice < minPrice ? f : min;
    }, null);

    if (ekonomiczny) return ekonomiczny;
    if (list[2]) return list[2];
    if (alt) return alt;
    return best;
}

describe('Testy rekomendacji', () => {

    describe('1. Usuwanie alergenów', () => {
        test('Powinien odrzucić paszę alergeny (owies)', () => {
            const feed = { nazwa: 'Pasza Owies', alergeny: ['owies', 'lucerna'] };
            const userAllergies = ['owies'];
            const isSafe = filterAllergens(feed, userAllergies);
            expect(isSafe).toBe(false); 
        });

        test('Powinien wybrać paszę nie zawierającą alergenów', () => {
            const feed = { nazwa: 'Pasza Bez Zbóż', alergeny: ['lucerna', 'soja'] };
            const userAllergies = ['owies'];
            const isSafe = filterAllergens(feed, userAllergies);
            expect(isSafe).toBe(true);
        });
    });

    describe('2. Procent zgodności', () => {
        test('Powinien dać 100% gdy wszystkie cele  są spełnione', () => {
            const feed = { zalecenia: ['energia', 'masa'] };
            const primaryReq = new Set(['energia', 'masa']);
            const secondaryReq = new Set([]);
            const score = calculateScore(feed, primaryReq, secondaryReq);
            expect(score).toBe(100);
        });
    });

    describe('3. Obliczanie dziennej dawki', () => {
        test('Powinien poprawnie obliczyć dawkę zależną od wagi', () => {
            const horseWeight = 600;
            const pasza = {
                cena: 100, waga: 20,
                dawkowanie: [300],
                kalkulowac_dawke: 'tak'
            };
            const result = calculateMonthlyCost(pasza, null, null, [], horseWeight);
            expect(result.dailyFeed).toBe("1.80");
        });

        test('Powinien przyjąć stałą dawkę (kalkulowac_dawke: nie)', () => {
            const horseWeight = 600;
            const suplement = {
                cena: 50, waga: 1,
                dawkowanie: [50], 
                kalkulowac_dawke: 'nie'
            };
            const result = calculateMonthlyCost(null, null, null, [suplement], horseWeight);
            expect(result.dailySupplement).toBe("0.050");
        });
    });

    describe('4. Obliczanie kosztów miesięcznych', () => {
        test('Powinien poprawnie obliczyć koszt miesięczny', () => {
            const horseWeight = 500;
            const pasza = {
                cena: 100, waga: 20,
                dawkowanie: [200], 
                kalkulowac_dawke: 'tak'
            };
            const result = calculateMonthlyCost(pasza, null, null, [], horseWeight);
            expect(result.monthlyCost).toBe(150);
        });
    });

    describe('5. Dobór suplementów', () => {
        test('Powinien wybrać jeden produkt zamiast dwóch osobnych', () => {
            const requiredTags = new Set(['stawy', 'kopyta']);
            const availableList = [
                { nazwa: 'Produkt Combo', zalecenia: ['stawy', 'kopyta'], cena: 100 },
                { nazwa: 'Tylko Stawy', zalecenia: ['stawy'], cena: 50 },
                { nazwa: 'Tylko Kopyta', zalecenia: ['kopyta'], cena: 50 }
            ];
            const result = pickSmartSupplements(availableList, requiredTags);
            expect(result.length).toBe(1);
            expect(result[0].nazwa).toBe('Produkt Combo');
        });

        test('Powinien pominąć suplement, który nie wnosi nic nowego', () => {
            const requiredTags = new Set(['stawy']);
            const availableList = [
                { nazwa: 'Stawy 1', zalecenia: ['stawy'] },
                { nazwa: 'Stawy 2', zalecenia: ['stawy'] }
            ];
            const result = pickSmartSupplements(availableList, requiredTags);
            expect(result.length).toBe(1);
            expect(result[0].nazwa).toBe('Stawy 1');
        });
    });

    describe('6. Wybór opcji ekonomicznej', () => {
        test('Powinien wybrać produkt tańszy, ale spełniający minimalny próg punktowy', () => {
            const best = { nazwa: 'Drogie ale najlepsze', score: 100, cena: 300, waga: 20 };
            const alt = null;
            const list = [
                best,
                { nazwa: 'Tani słaby', score: 20, cena: 20, waga: 20 },
                { nazwa: 'Optymalny', score: 80, cena: 100, waga: 20 }
            ];
            const minScore = 60;
            const result = findEkonomiczny(list, best, alt, minScore);
            expect(result.nazwa).toBe('Optymalny');
        });

        test('Powinien zwrócić "Best", jeśli nie ma żadnej tańszej alternatywy spełniającej kryteria', () => {
            const best = { nazwa: 'Jedyny Dobry', score: 90, cena: 100, waga: 20 };
            const list = [
                best,
                { nazwa: 'Słaby', score: 30, cena: 10, waga: 20 }
            ];
            const minScore = 60;
            const result = findEkonomiczny(list, best, null, minScore);
            expect(result.nazwa).toBe('Jedyny Dobry');
        });
    });

});