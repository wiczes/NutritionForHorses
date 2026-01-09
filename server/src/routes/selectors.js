const { normalize } = require('./mapping');

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
                if (!coveredTags.has(normReq)) {
                    offersNewValue = true;
                }
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

module.exports = { pickSmartSupplements, findEkonomiczny };