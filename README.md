# NutritionForHorses
A system supporting horse diet selection

Python script for adding items to the database:

from pymongo import MongoClient
import questionary

client = MongoClient("key")
db = client['DietaDlaKoni']
collection = db['Pasze']

alergeny_options = ["gluten", "pszenica", "orkisz", "soja", "lucerna", "groch", "owies", "rzepak", "slonecznik", "kukurydza", "jeczmien", "len", "zyto", "marchew", "jablko", "wyslodki"]
zalecenia_options = ["wrzody", "slabybrzuch", "slabejelita", "kwasowosc", "odpornosc", "niejadki", "niskoskrobiowa", "niskocukrowa", "niskobialkowa", "redukcja", "utrzymanie", "nabraniewagi", "slabasiersc", "slabezeby", "zrebie", "mlode", "senior", "sport", "wyczynowy", "szybkaenergia", "zrownowazonaenergia", "budowamiesni", "nadpobudliwosc", "ospalosc"]
typ_options = ["musli", "granulat", "sieczka", "mesz", "suplement"]
kalkulowac_dawke_options = ["tak", "nie"]
jednostka_wagi_options = ["kg", "g"]

nazwa = questionary.text("Nazwa:").ask()
cena = int(questionary.text("Cena:").ask())
waga = int(questionary.text("Waga:").ask())
zdjecie = questionary.text("Zdjęcie (URL):").ask()

alergeny = questionary.checkbox("Alergeny:", choices=alergeny_options).ask()
zalecenia = questionary.checkbox("Zalecenia:", choices=zalecenia_options).ask()
typ = questionary.select("Typ:", choices=typ_options).ask()
kalkulowac_dawke = questionary.select("Kalkulować dawkę?", choices=kalkulowac_dawke_options).ask()
jednostka_wagi = questionary.select("Jednostka wagi:", choices=jednostka_wagi_options).ask()

dawkowanie = [int(x) for x in questionary.text("Dawkowanie (np. 5,10):").ask().split(",")]

doc = {
    "nazwa": nazwa,
    "typ": typ,
    "alergeny": alergeny,
    "cena": cena,
    "waga": waga,
    "jednostka_wagi": jednostka_wagi,
    "zalecenia": zalecenia,
    "dawkowanie": dawkowanie,
    "kalkulowac_dawke": kalkulowac_dawke,
    "zdjecie": zdjecie
}

collection.insert_one(doc)
print("Dodano!")