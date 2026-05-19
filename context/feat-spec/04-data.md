# 04. Specifikace Seed Dat (Mock Data Specification)

Tento dokument detailně specifikuje **výchozí testovací data (seed data)** pro aplikaci Tréninkový Plánovač. Data jsou rozdělena do dvou hlavních tréninkových směrů: **Fitness** (silový a kondiční trénink v posilovně) a **Box** (specifický bojový trénink, technika a kondice). 

Všechny entity striktně používají **klientsky generovaná UUID (String)** a odpovídají Zod validacím a Mongoose schématům.

---

## 👥 1. Uživatelské Účty (Users)

Pro testování rolí a oprávnění definujeme dva testovací uživatele.

### Trenér (Coach)
* **UUID (`_id`)**: `c2069e2c-381c-43df-8121-66385f09623e`
* **Email**: `coach.tomas@trainingplanner.cz`
* **Jméno**: `Tomas Coach`
* **Role**: `coach`

### Atlet / Klient (Athlete)
* **UUID (`_id`)**: `a318b76c-38fa-4e78-98e3-466d11ff3e43`
* **Email**: `athlete.jan@trainingplanner.cz`
* **Jméno**: `Jan Athlete`
* **Role**: `athlete`

---

## 🏋️ 2. Katalog Cviků (Exercise Catalog)

Katalog cviků slouží jako globální šablona. Cviky mají předdefinované kategorie (`strength`, `combat`, `cardio`, `mobility`, `stretch`) a výchozí výkonnostní metriky.

### A. Fitness Cviky (Posilovna)

| UUID (`_id`) | Název cviku (CZ) | Kategorie | Popis | Výchozí metriky |
| :--- | :--- | :--- | :--- | :--- |
| `e1069e2c-381c-43df-8121-66385f09623e` | **Bench Press** (Tlak na lavici) | `strength` | Klasický tlak s obouruční činkou na rovné lavici pro rozvoj prsních svalů. | 4 série × 8 opakování, 80 kg, pauza 120s |
| `e2069e2c-381c-43df-8121-66385f09623e` | **Back Squat** (Dřep s činkou) | `strength` | Hluboký dřep s velkou činkou na zádech pro sílu dolních končetin. | 4 série × 6 opakování, 100 kg, pauza 150s |
| `e3069e2c-381c-43df-8121-66385f09623e` | **Romanian Deadlift** (Rumunský tah) | `strength` | Mrtvý tah s mírně pokrčenými koleny zaměřený na hamstringy a hýždě. | 3 série × 10 opakování, 70 kg, pauza 90s |
| `e4069e2c-381c-43df-8121-66385f09623e` | **Pull-ups** (Shyby nadhmatem) | `strength` | Shyby na hrazdě s plným rozsahem pohybu pro rozvoj zádových svalů. | 3 série × 8 opakování, 0 kg (vlastní váha), pauza 90s |
| `e5069e2c-381c-43df-8121-66385f09623e` | **Overhead Press** (Tlak nad hlavu) | `strength` | Tlak s velkou činkou nad hlavu ve stoji pro sílu ramen a středu těla. | 3 série × 8 opakování, 40 kg, pauza 120s |
| `e6069e2c-381c-43df-8121-66385f09623e` | **Dumbbell Bicep Curl** (Biceps) | `strength` | Střídavý bicepsový zdvih s jednoručkami vestoje. | 3 série × 12 opakování, 12 kg, pauza 60s |
| `e7069e2c-381c-43df-8121-66385f09623e` | **Rowing Machine** (Veslování) | `cardio` | Kondiční veslování na trenažéru se střední intenzitou. | 1 série × 1200s (20 min), pauza 0s |
| `e8069e2c-381c-43df-8121-66385f09623e` | **World's Greatest Stretch** | `mobility` | Komplexní dynamický strečink pro mobilizaci kyčlí, páteře a ramen. | 2 série × 6 opakování na stranu, pauza 30s |

### B. Boxing Cviky (Bojové sporty & Kondice)

| UUID (`_id`) | Název cviku (CZ) | Kategorie | Popis | Výchozí metriky |
| :--- | :--- | :--- | :--- | :--- |
| `eb069e2c-381c-43df-8121-66385f09623e` | **Shadow Boxing** (Stínový box) | `combat` | Vizualizační box před zrcadlem se zaměřením na uvolněnost a techniku úderů. | 3 kola × 180s (3 min), pauza 60s |
| `eb169e2c-381c-43df-8121-66385f09623e` | **Heavy Bag Work** (Boxovací pytel) | `combat` | Intenzivní nácvik kombinací a síly úderů na těžkém pytli. | 4 kola × 180s (3 min), pauza 60s |
| `eb269e2c-381c-43df-8121-66385f09623e` | **Mit Work** (Lapování s trenérem) | `combat` | Přesné kombinace, reakční rychlost a obranné prvky na lapách. | 3 kola × 180s (3 min), pauza 60s |
| `eb369e2c-381c-43df-8121-66385f09623e` | **Technical Sparring** (Sparing) | `combat` | Kontrolovaný cvičný zápas se zaměřením na taktiku a postřeh (50% síla). | 4 kola × 180s (3 min), pauza 60s |
| `eb469e2c-381c-43df-8121-66385f09623e` | **Jump Rope** (Švihadlo) | `cardio` | Rychlé skákání přes švihadlo pro rozvoj koordinace a lýtkové vytrvalosti. | 3 kola × 180s (3 min), pauza 30s |
| `eb569e2c-381c-43df-8121-66385f09623e` | **Burpees** (Angličáky) | `cardio` | Komplexní plyometrický cvik pro rozvoj explozivní síly celého těla. | 3 série × 15 opakování, pauza 45s |
| `eb669e2c-381c-43df-8121-66385f09623e` | **Shoulder Band Dislocates** | `mobility` | Kroužení rameny s odporovou gumou pro rozsah a zdraví ramenního kloubu. | 2 série × 15 opakování, pauza 30s |

---

## 📋 3. Šablony Tréninků (Workout Templates)

Šablony slouží pro rychlé plánování celého tréninkového dne a jsou uloženy v kolekci `Workouts`.

### Šablona A: Fitness Upper Body (Tlak & Tah)
* **UUID (`_id`)**: `w1069e2c-381c-43df-8121-66385f09623e`
* **Cílová délka**: 75 minut
* **Přiřazené cviky**:
  1. **World's Greatest Stretch** (Mobility warmup - 2 série × 6 reps)
  2. **Bench Press** (Strength - 4 série × 8 reps, 80 kg)
  3. **Pull-ups** (Strength - 3 série × 8 reps, 0 kg)
  4. **Overhead Press** (Strength - 3 série × 8 reps, 40 kg)
  5. **Dumbbell Bicep Curl** (Strength - 3 série × 12 reps, 12 kg)

### Šablona B: Boxing Cardio Conditioning (Kondice)
* **UUID (`_id`)**: `wb069e2c-381c-43df-8121-66385f09623e`
* **Cílová délka**: 60 minut
* **Přiřazené cviky**:
  1. **Shoulder Band Dislocates** (Mobility - 2 série × 15 reps)
  2. **Jump Rope** (Cardio - 3 kola × 180s, pauza 30s)
  3. **Shadow Boxing** (Combat - 3 kola × 180s, pauza 60s)
  4. **Heavy Bag Work** (Combat - 4 kola × 180s, pauza 60s)
  5. **Burpees** (Cardio - 3 série × 15 reps, pauza 45s)

---

## 🗓️ 4. Tréninkové Cykly (Cycles ➡️ Mesocycles ➡️ Microcycles)

Tyto struktury seskupují tréninkový proces do logických celků pro atlety.

### Příklad 1: Silový Rozvoj Fitness (12 týdnů)
* **Makrocyklus (`Cycle`)**:
  * **UUID**: `f17cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Silový rozvoj & Hypertrofie 2026`
  * **Od - Do**: `2026-05-01` do `2026-07-24`
  * **Status**: `active`
* **Mezocyklus (`Mesocycle`)**:
  * **UUID**: `f27cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Objemová a silová akumulace (Blok 1)`
  * **Zaměření**: `strength`
  * **Od - Do**: `2026-05-01` do `2026-05-28` (4 týdny)
* **Mikrocyklus (`Microcycle`)**:
  * **UUID**: `f37cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Akumulační týden 1`
  * **Pořadí**: `1`
  * **Od - Do**: `2026-05-01` do `2026-05-07`

### Příklad 2: Příprava na Zápas v Boxu (8 týdnů)
* **Makrocyklus (`Cycle`)**:
  * **UUID**: `b17cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Příprava na Amatérský šampionát`
  * **Od - Do**: `2026-05-18` do `2026-07-12`
  * **Status**: `active`
* **Mezocyklus (`Mesocycle`)**:
  * **UUID**: `b27cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Specifická vytrvalost a lapování (Blok 1)`
  * **Zaměření**: `endurance`
  * **Od - Do**: `2026-05-18` do `2026-06-14` (4 týdny)
* **Mikrocyklus (`Microcycle`)**:
  * **UUID**: `b37cf91a-be12-4217-bc22-cf8bb95b28da`
  * **Název**: `Objemový specifický týden 1`
  * **Pořadí**: `1`
  * **Od - Do**: `2026-05-18` do `2026-05-24`

---

## 📅 5. Tréninkové Jednotky v Kalendáři (Training Sessions)

Přiřazené tréninky s reálným logováním splněných sérií.

### Trénink 1: Odtrénovaný Fitness trénink
* **UUID (`_id`)**: `s1069e2c-381c-43df-8121-66385f09623e`
* **Uživatel**: `Jan Athlete`
* **Datum tréninku**: `2026-05-19`
* **Název**: `Těžký horní trénink (z šablony Upper Body)`
* **Status**: `completed`
* **Reálná délka**: `72 minut`
* **Struktura časových bloků (Time Blocks & Exercises)**:
  * **Blok 1: Zahřátí & Mobilita** (délka 12 min):
    * **World's Greatest Stretch** (`e8069e2c-381c-43df-8121-66385f09623e`): Plánováno 2 série × 6 reps.
      * *Zapsané výsledky*:
        * Série 1: 6 reps (completed)
        * Série 2: 6 reps (completed)
  * **Blok 2: Hlavní Síla** (délka 45 min):
    * **Bench Press** (`e1069e2c-381c-43df-8121-66385f09623e`): Plánováno 4 série × 8 reps s 80 kg.
      * *Zapsané výsledky (progrese hmotnosti)*:
        * Série 1: 8 reps × 80 kg (completed)
        * Série 2: 8 reps × 80 kg (completed)
        * Série 3: 8 reps × 82.5 kg (completed - zvýšena váha!)
        * Série 4: 7 reps × 82.5 kg (completed - blízko selhání)
  * **Blok 3: Doplňky** (délka 15 min):
    * **Dumbbell Bicep Curl** (`e6069e2c-381c-43df-8121-66385f09623e`): Plánováno 3 série × 12 reps se 12 kg.
      * *Zapsané výsledky*:
        * Série 1: 12 reps × 12 kg (completed)
        * Série 2: 12 reps × 12 kg (completed)
        * Série 3: 10 reps × 12 kg (completed)
* **Poznámky**: `Skvělý trénink, Bench Press šel nečekaně dobře. Navýšil jsem váhu na poslední 2 série. Biceps už byl ke konci extrémně napumpovaný.`