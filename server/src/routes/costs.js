function parseNum(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = val.toString().replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function calculateMonthlyCost(pasza, sieczka, mesz, suplementy, horseWeight) {
    const weight = parseNum(horseWeight) || 500;
    const suppList = Array.isArray(suplementy) ? suplementy : (suplementy ? [suplementy] : []);

    const calculateItemCost = (item, role) => {
        if (!item) return { cost: 0, dailyKg: 0 };

        const price = parseNum(item.cena);
        let bagWeight = parseNum(item.waga);

        if (bagWeight <= 0) bagWeight = 1;

        const pricePerKg = price / bagWeight;

        if (!item.dawkowanie || !Array.isArray(item.dawkowanie) || item.dawkowanie.length === 0) {
            return { cost: 0, dailyKg: 0 };
        }
        const avgDoseGrams = item.dawkowanie.reduce((a, b) => parseNum(a) + parseNum(b), 0) / item.dawkowanie.length;
        
        let dailyGrams = 0;
        const shouldCalc = item.kalkulowac_dawke && item.kalkulowac_dawke.toString().toLowerCase().trim() === 'tak';

        if (shouldCalc) {
            dailyGrams = avgDoseGrams * (weight / 100.0);
        } else {
            dailyGrams = avgDoseGrams;
        }

        const dailyKg = dailyGrams / 1000.0; 
        const monthlyKg = dailyKg * 30; 
        const monthlyItemCost = monthlyKg * pricePerKg;

        return {
            cost: monthlyItemCost,
            dailyKg: dailyKg
        };
    };

    const paszaCalc = calculateItemCost(pasza, 'Pasza');
    const sieczkaCalc = calculateItemCost(sieczka, 'Sieczka');
    const meszCalc = calculateItemCost(mesz, 'Mesz');
    
    let suppCost = 0;
    let suppDailyKg = 0;

    suppList.forEach(s => {
        const res = calculateItemCost(s, 'Suplement');
        suppCost += res.cost;
        suppDailyKg += res.dailyKg;
    });

    const totalMonthlyCost = paszaCalc.cost + sieczkaCalc.cost + meszCalc.cost + suppCost;

    return {
        dailyFeed: paszaCalc.dailyKg.toFixed(2),
        dailyRoughage: sieczkaCalc.dailyKg.toFixed(2),
        dailyMash: meszCalc.dailyKg.toFixed(2),
        dailySupplement: suppDailyKg.toFixed(3),
        monthlyCost: Math.round(totalMonthlyCost)
    };
}

module.exports = { calculateMonthlyCost };