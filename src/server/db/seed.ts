import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from './connection';

// Modely
import User from './models/User';
import Exercise from './models/Exercise';
import Cycle from './models/Cycle';
import Mesocycle from './models/Mesocycle';
import Microcycle from './models/Microcycle';
import Workout from './models/Workout';
import TrainingSession from './models/TrainingSession';

// Načtení environmentálních proměnných z .env.development pokud MONGODB_URI chybí
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.development');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Nepodařilo se načíst .env.development file:', err);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://tp_dev_user:complex_dev_password_987@localhost:27017/training-planner?authSource=admin';

// Definice UUIDs odpovídajících context/feat-spec/04-data.md
const COACH_ID = 'c2069e2c-381c-43df-8121-66385f09623e';
const ATHLETE_ID = 'a318b76c-38fa-4e78-98e3-466d11ff3e43';

const EXERCISE_IDS = {
  // Fitness
  benchPress: 'e1069e2c-381c-43df-8121-66385f09623e',
  backSquat: 'e2069e2c-381c-43df-8121-66385f09623e',
  romanianDeadlift: 'e3069e2c-381c-43df-8121-66385f09623e',
  pullUps: 'e4069e2c-381c-43df-8121-66385f09623e',
  overheadPress: 'e5069e2c-381c-43df-8121-66385f09623e',
  bicepCurl: 'e6069e2c-381c-43df-8121-66385f09623e',
  rowing: 'e7069e2c-381c-43df-8121-66385f09623e',
  worldsGreatestStretch: 'e8069e2c-381c-43df-8121-66385f09623e',

  // Box
  shadowBoxing: 'eb069e2c-381c-43df-8121-66385f09623e',
  heavyBagWork: 'eb169e2c-381c-43df-8121-66385f09623e',
  mitWork: 'eb269e2c-381c-43df-8121-66385f09623e',
  sparring: 'eb369e2c-381c-43df-8121-66385f09623e',
  jumpRope: 'eb469e2c-381c-43df-8121-66385f09623e',
  burpees: 'eb569e2c-381c-43df-8121-66385f09623e',
  shoulderDislocates: 'eb669e2c-381c-43df-8121-66385f09623e'
};

const WORKOUT_IDS = {
  fitnessUpper: 'w1069e2c-381c-43df-8121-66385f09623e',
  boxingConditioning: 'wb069e2c-381c-43df-8121-66385f09623e'
};

const CYCLES = {
  fitness: {
    cycle: 'f17cf91a-be12-4217-bc22-cf8bb95b28da',
    meso: 'f27cf91a-be12-4217-bc22-cf8bb95b28da',
    micro: 'f37cf91a-be12-4217-bc22-cf8bb95b28da'
  },
  boxing: {
    cycle: 'b17cf91a-be12-4217-bc22-cf8bb95b28da',
    meso: 'b27cf91a-be12-4217-bc22-cf8bb95b28da',
    micro: 'b37cf91a-be12-4217-bc22-cf8bb95b28da'
  }
};

const SESSION_IDS = {
  fitnessSession: 's1069e2c-381c-43df-8121-66385f09623e'
};

async function seed() {
  console.log('🌱 Zahajuji naplňování databáze (seeding)...');
  process.env.MONGODB_URI = MONGODB_URI;

  await connectToDatabase();

  // 1. Vyčištění stávajících dat
  console.log('🧹 Čištění existujících kolekcí...');
  await User.deleteMany({});
  await Exercise.deleteMany({});
  await Cycle.deleteMany({});
  await Mesocycle.deleteMany({});
  await Microcycle.deleteMany({});
  await Workout.deleteMany({});
  await TrainingSession.deleteMany({});
  console.log('✅ Databáze vyčištěna.');

  // 2. Vložení uživatelů
  console.log('👥 Vkládání uživatelů...');
  const users = [
    {
      _id: COACH_ID,
      email: 'coach.tomas@trainingplanner.cz',
      name: 'Tomas Coach',
      role: 'coach'
    },
    {
      _id: ATHLETE_ID,
      email: 'athlete.jan@trainingplanner.cz',
      name: 'Jan Athlete',
      role: 'athlete'
    }
  ];
  await User.insertMany(users);
  console.log(`✅ Vloženi ${users.length} uživatelé.`);

  // 3. Vložení katalogu cviků
  console.log('🏋️ Vkládání katalogu cviků...');
  const exercises = [
    // Fitness
    {
      _id: EXERCISE_IDS.benchPress,
      name: 'Bench Press',
      category: 'strength',
      description: 'Klasický tlak s obouruční činkou na rovné lavici pro rozvoj prsních svalů.',
      videoUrl: '',
      defaultMetrics: { sets: 4, reps: 8, weight: 80, duration: 0, rounds: 1, roundDuration: 180, restDuration: 120 }
    },
    {
      _id: EXERCISE_IDS.backSquat,
      name: 'Back Squat',
      category: 'strength',
      description: 'Hluboký dřep s velkou činkou na zádech pro sílu dolních končetin.',
      videoUrl: '',
      defaultMetrics: { sets: 4, reps: 6, weight: 100, duration: 0, rounds: 1, roundDuration: 180, restDuration: 150 }
    },
    {
      _id: EXERCISE_IDS.romanianDeadlift,
      name: 'Romanian Deadlift',
      category: 'strength',
      description: 'Mrtvý tah s mírně pokrčenými koleny zaměřený na hamstringy a hýždě.',
      videoUrl: '',
      defaultMetrics: { sets: 3, reps: 10, weight: 70, duration: 0, rounds: 1, roundDuration: 180, restDuration: 90 }
    },
    {
      _id: EXERCISE_IDS.pullUps,
      name: 'Pull-ups',
      category: 'strength',
      description: 'Shyby na hrazdě s plným rozsahem pohybu pro rozvoj zádových svalů.',
      videoUrl: '',
      defaultMetrics: { sets: 3, reps: 8, weight: 0, duration: 0, rounds: 1, roundDuration: 180, restDuration: 90 }
    },
    {
      _id: EXERCISE_IDS.overheadPress,
      name: 'Overhead Press',
      category: 'strength',
      description: 'Tlak s velkou činkou nad hlavu ve stoji pro sílu ramen a středu těla.',
      videoUrl: '',
      defaultMetrics: { sets: 3, reps: 8, weight: 40, duration: 0, rounds: 1, roundDuration: 180, restDuration: 120 }
    },
    {
      _id: EXERCISE_IDS.bicepCurl,
      name: 'Dumbbell Bicep Curl',
      category: 'strength',
      description: 'Střídavý bicepsový zdvih s jednoručkami vestoje.',
      videoUrl: '',
      defaultMetrics: { sets: 3, reps: 12, weight: 12, duration: 0, rounds: 1, roundDuration: 180, restDuration: 60 }
    },
    {
      _id: EXERCISE_IDS.rowing,
      name: 'Rowing Machine',
      category: 'cardio',
      description: 'Kondiční veslování na trenažéru se střední intenzitou.',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 1200, rounds: 1, roundDuration: 1200, restDuration: 0 }
    },
    {
      _id: EXERCISE_IDS.worldsGreatestStretch,
      name: "World's Greatest Stretch",
      category: 'mobility',
      description: 'Komplexní dynamický strečink pro mobilizaci kyčlí, páteře a ramen.',
      videoUrl: '',
      defaultMetrics: { sets: 2, reps: 6, weight: 0, duration: 0, rounds: 1, roundDuration: 180, restDuration: 30 }
    },

    // Box
    {
      _id: EXERCISE_IDS.shadowBoxing,
      name: 'Shadow Boxing',
      category: 'combat',
      description: 'Vizualizační box před zrcadlem se zaměřením na uvolněnost a techniku úderů.',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 0, rounds: 3, roundDuration: 180, restDuration: 60 }
    },
    {
      _id: EXERCISE_IDS.heavyBagWork,
      name: 'Heavy Bag Work',
      category: 'combat',
      description: 'Intenzivní nácvik kombinací a síly úderů na těžkém pytli.',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 0, rounds: 4, roundDuration: 180, restDuration: 60 }
    },
    {
      _id: EXERCISE_IDS.mitWork,
      name: 'Mit Work',
      category: 'combat',
      description: 'Přesné kombinace, reakční rychlost a obranné prvky na lapách s trenérem.',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 0, rounds: 3, roundDuration: 180, restDuration: 60 }
    },
    {
      _id: EXERCISE_IDS.sparring,
      name: 'Technical Sparring',
      category: 'combat',
      description: 'Kontrolovaný cvičný zápas se zaměřením na taktiku a postřeh (50% síla).',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 0, rounds: 4, roundDuration: 180, restDuration: 60 }
    },
    {
      _id: EXERCISE_IDS.jumpRope,
      name: 'Jump Rope',
      category: 'cardio',
      description: 'Rychlé skákání přes švihadlo pro rozvoj koordinace a lýtkové vytrvalosti.',
      videoUrl: '',
      defaultMetrics: { sets: 1, reps: 0, weight: 0, duration: 0, rounds: 3, roundDuration: 180, restDuration: 30 }
    },
    {
      _id: EXERCISE_IDS.burpees,
      name: 'Burpees',
      category: 'cardio',
      description: 'Komplexní plyometrický cvik pro rozvoj explozivní síly celého těla.',
      videoUrl: '',
      defaultMetrics: { sets: 3, reps: 15, weight: 0, duration: 0, rounds: 1, roundDuration: 180, restDuration: 45 }
    },
    {
      _id: EXERCISE_IDS.shoulderDislocates,
      name: 'Shoulder Band Dislocates',
      category: 'mobility',
      description: 'Kroužení rameny s odporovou gumou pro rozsah a zdraví ramenního kloubu.',
      videoUrl: '',
      defaultMetrics: { sets: 2, reps: 15, weight: 0, duration: 0, rounds: 1, roundDuration: 180, restDuration: 30 }
    }
  ];
  await Exercise.insertMany(exercises);
  console.log(`✅ Vloženo ${exercises.length} cviků do katalogu.`);

  // 4. Vložení cyklů (Cycles, Mesocycles, Microcycles)
  console.log('🗓️ Vkládání tréninkových cyklů...');

  // Fitness cyklus
  const fitnessCycle = new Cycle({
    _id: CYCLES.fitness.cycle,
    userId: ATHLETE_ID,
    name: 'Silový rozvoj & Hypertrofie 2026',
    description: '12-týdenní makrocyklus zaměřený na rozvoj maximální síly a hypertrofie svalstva.',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-07-24'),
    status: 'active'
  });
  await fitnessCycle.save();

  const fitnessMeso = new Mesocycle({
    _id: CYCLES.fitness.meso,
    cycleId: CYCLES.fitness.cycle,
    name: 'Objemová a silová akumulace (Blok 1)',
    description: 'Úvodní 4-týdenní blok s vyšším objemem práce pro stimulaci hypertrofie a adaptaci šlach.',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-28'),
    focus: 'strength'
  });
  await fitnessMeso.save();

  const fitnessMicro = new Microcycle({
    _id: CYCLES.fitness.micro,
    mesocycleId: CYCLES.fitness.meso,
    name: 'Akumulační týden 1',
    description: 'Stabilizační týden se 70-75% maximální intenzity pro nastavení základních vah.',
    order: 1,
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-07')
  });
  await fitnessMicro.save();

  // Boxing cyklus
  const boxingCycle = new Cycle({
    _id: CYCLES.boxing.cycle,
    userId: ATHLETE_ID,
    name: 'Příprava na Amatérský šampionát',
    description: 'Specifický 8-týdenní kondiční a technický makrocyklus pro vrcholnou zápasovou formu.',
    startDate: new Date('2026-05-18'),
    endDate: new Date('2026-07-12'),
    status: 'active'
  });
  await boxingCycle.save();

  const boxingMeso = new Mesocycle({
    _id: CYCLES.boxing.meso,
    cycleId: CYCLES.boxing.cycle,
    name: 'Specifická vytrvalost a lapování (Blok 1)',
    description: 'Rozvoj specifické kardiovaskulární vytrvalosti a reakční rychlosti.',
    startDate: new Date('2026-05-18'),
    endDate: new Date('2026-06-14'),
    focus: 'endurance'
  });
  await boxingMeso.save();

  const boxingMicro = new Microcycle({
    _id: CYCLES.boxing.micro,
    mesocycleId: CYCLES.boxing.meso,
    name: 'Objemový specifický týden 1',
    description: 'První mikrocyklus zaměřený na základy pohybu a vysokou hustotu tréninkového zatížení.',
    order: 1,
    startDate: new Date('2026-05-18'),
    endDate: new Date('2026-05-24')
  });
  await boxingMicro.save();

  console.log('✅ Úspěšně vložena struktura cyklů (Makro -> Meso -> Micro).');

  // 5. Vložení šablon tréninků (Workout Templates)
  console.log('📋 Vkládání šablon tréninků (Workouts)...');
  const workouts = [
    {
      _id: WORKOUT_IDS.fitnessUpper,
      userId: ATHLETE_ID,
      name: 'Fitness Upper Body (Tlak & Tah)',
      description: 'Komplexní trénink horní poloviny těla zaměřený na tlakové a tahové svalové řetězce.',
      targetDuration: 75,
      exercises: [
        {
          id: 'ae1069e2-381c-43df-8121-66385f09623e',
          exerciseId: EXERCISE_IDS.worldsGreatestStretch,
          name: "World's Greatest Stretch",
          category: 'mobility',
          metrics: { sets: 2, reps: 6, restDuration: 30 }
        },
        {
          id: 'ae1069e2-381c-43df-8121-66385f09623f',
          exerciseId: EXERCISE_IDS.benchPress,
          name: 'Bench Press',
          category: 'strength',
          metrics: { sets: 4, reps: 8, weight: 80, restDuration: 120 }
        },
        {
          id: 'ae1069e2-381c-43df-8121-66385f096240',
          exerciseId: EXERCISE_IDS.pullUps,
          name: 'Pull-ups',
          category: 'strength',
          metrics: { sets: 3, reps: 8, weight: 0, restDuration: 90 }
        },
        {
          id: 'ae1069e2-381c-43df-8121-66385f096241',
          exerciseId: EXERCISE_IDS.overheadPress,
          name: 'Overhead Press',
          category: 'strength',
          metrics: { sets: 3, reps: 8, weight: 40, restDuration: 120 }
        },
        {
          id: 'ae1069e2-381c-43df-8121-66385f096242',
          exerciseId: EXERCISE_IDS.bicepCurl,
          name: 'Dumbbell Bicep Curl',
          category: 'strength',
          metrics: { sets: 3, reps: 12, weight: 12, restDuration: 60 }
        }
      ]
    },
    {
      _id: WORKOUT_IDS.boxingConditioning,
      userId: ATHLETE_ID,
      name: 'Boxing Cardio Conditioning (Kondice)',
      description: 'Intenzivní kruhový trénink pro rozvoj vytrvalosti ramen, nohou a explozivní síly.',
      targetDuration: 60,
      exercises: [
        {
          id: 'be1069e2-381c-43df-8121-66385f09623e',
          exerciseId: EXERCISE_IDS.shoulderDislocates,
          name: 'Shoulder Band Dislocates',
          category: 'mobility',
          metrics: { sets: 2, reps: 15, restDuration: 30 }
        },
        {
          id: 'be1069e2-381c-43df-8121-66385f09623f',
          exerciseId: EXERCISE_IDS.jumpRope,
          name: 'Jump Rope',
          category: 'cardio',
          metrics: { rounds: 3, roundDuration: 180, restDuration: 30 }
        },
        {
          id: 'be1069e2-381c-43df-8121-66385f096240',
          exerciseId: EXERCISE_IDS.shadowBoxing,
          name: 'Shadow Boxing',
          category: 'combat',
          metrics: { rounds: 3, roundDuration: 180, restDuration: 60 }
        },
        {
          id: 'be1069e2-381c-43df-8121-66385f096241',
          exerciseId: EXERCISE_IDS.heavyBagWork,
          name: 'Heavy Bag Work',
          category: 'combat',
          metrics: { rounds: 4, roundDuration: 180, restDuration: 60 }
        },
        {
          id: 'be1069e2-381c-43df-8121-66385f096242',
          exerciseId: EXERCISE_IDS.burpees,
          name: 'Burpees',
          category: 'cardio',
          metrics: { sets: 3, reps: 15, restDuration: 45 }
        }
      ]
    }
  ];
  await Workout.insertMany(workouts);
  console.log(`✅ Úspěšně vloženy ${workouts.length} šablony tréninků.`);

  // 6. Vložení konkrétní tréninkové jednotky v kalendáři (Training Session)
  console.log('📅 Vkládání tréninkových jednotek do kalendáře (TrainingSessions)...');
  const session = new TrainingSession({
    _id: SESSION_IDS.fitnessSession,
    userId: ATHLETE_ID,
    microcycleId: CYCLES.fitness.micro, // Zařazeno do prvního mikrocyklu fitness plánu
    workoutId: WORKOUT_IDS.fitnessUpper, // Vychází ze šablony horního tréninku
    name: 'Těžký horní trénink (z šablony Upper Body)',
    date: new Date('2026-05-19'),
    duration: 72,
    status: 'completed',
    notes: 'Skvělý trénink, Bench Press šel nečekaně dobře. Navýšil jsem váhu na poslední 2 série. Biceps už byl ke konci extrémně napumpovaný.',
    timeBlocks: [
      {
        id: 'tb1069e2-381c-43df-8121-66385f09623e',
        name: 'Zahřátí & Mobilita',
        duration: 12,
        exercises: [
          {
            _id: 'se1069e2-381c-43df-8121-66385f09623e',
            exerciseId: EXERCISE_IDS.worldsGreatestStretch,
            name: "World's Greatest Stretch",
            category: 'mobility',
            metrics: { sets: 2, reps: 6, restDuration: 30 },
            completedSets: [
              { reps: 6, weight: 0, completed: true },
              { reps: 6, weight: 0, completed: true }
            ]
          }
        ]
      },
      {
        id: 'tb1069e2-381c-43df-8121-66385f09623f',
        name: 'Hlavní Síla',
        duration: 45,
        exercises: [
          {
            _id: 'se1069e2-381c-43df-8121-66385f09623f',
            exerciseId: EXERCISE_IDS.benchPress,
            name: 'Bench Press',
            category: 'strength',
            metrics: { sets: 4, reps: 8, weight: 80, restDuration: 120 },
            completedSets: [
              { reps: 8, weight: 80, completed: true },
              { reps: 8, weight: 80, completed: true },
              { reps: 8, weight: 82.5, completed: true },
              { reps: 7, weight: 82.5, completed: true }
            ]
          }
        ]
      },
      {
        id: 'tb1069e2-381c-43df-8121-66385f096240',
        name: 'Doplňky',
        duration: 15,
        exercises: [
          {
            _id: 'se1069e2-381c-43df-8121-66385f096240',
            exerciseId: EXERCISE_IDS.bicepCurl,
            name: 'Dumbbell Bicep Curl',
            category: 'strength',
            metrics: { sets: 3, reps: 12, weight: 12, restDuration: 60 },
            completedSets: [
              { reps: 12, weight: 12, completed: true },
              { reps: 12, weight: 12, completed: true },
              { reps: 10, weight: 12, completed: true }
            ]
          }
        ]
      }
    ]
  });
  await session.save();
  console.log('✅ Úspěšně vložena tréninková jednotka.');

  // Zavření spojení s DB
  await mongoose.connection.close();
  console.log('🎯 Databáze byla úspěšně naplněna testovacími daty!');
}

seed().catch((err) => {
  console.error('❌ Chyba při naplňování databáze:', err);
  mongoose.connection.close();
  process.exit(1);
});
