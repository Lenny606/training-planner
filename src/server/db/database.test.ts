import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Manual loading of .env.development if MONGODB_URI is not set
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
    // Ignore error and fallback to default
  }
}

const TEST_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://tp_dev_user:complex_dev_password_987@localhost:27017/training-planner?authSource=admin';

import { connectToDatabase } from './connection';
import { UserRepository } from './repositories/UserRepository';
import { CycleRepository } from './repositories/CycleRepository';
import { WorkoutRepository } from './repositories/WorkoutRepository';
import { TrainingSessionRepository } from './repositories/TrainingSessionRepository';

import User from './models/User';
import Cycle from './models/Cycle';
import Workout from './models/Workout';
import TrainingSession from './models/TrainingSession';

const TEST_USER_ID = '3318b76c-38fa-4e78-98e3-466d11ff3e43';
const TEST_CYCLE_ID = 'a78cf91a-be12-4217-bc22-cf8bb95b28da';
const TEST_WORKOUT_ID = '4a49c445-6677-4566-a361-bbfbb9c24ea2';
const TEST_SESSION_ID = '98b50e2d-dc99-43ef-b387-052637738f61';

describe('Integration Tests - Database Layer (Mongoose & Zod & Repositories)', () => {
  beforeAll(async () => {
    // Override MONGODB_URI to make sure connection uses it
    process.env.MONGODB_URI = TEST_MONGODB_URI;
    await connectToDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test collections
    await User.deleteMany({ _id: { $in: [TEST_USER_ID] } });
    await Cycle.deleteMany({ _id: { $in: [TEST_CYCLE_ID] } });
    await Workout.deleteMany({ _id: { $in: [TEST_WORKOUT_ID] } });
    await TrainingSession.deleteMany({ _id: { $in: [TEST_SESSION_ID] } });
  });

  describe('1. Connection Singleton', () => {
    it('successfully connects to the MongoDB container and is ready', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
  });

  describe('2. UserRepository & User Model (UUID)', () => {
    it('should save a new user, retrieve them, update them, and delete them', async () => {
      const userData = {
        _id: TEST_USER_ID,
        email: 'test.athlete@example.com',
        name: 'Test Athlete',
        role: 'athlete' as const
      };

      // Create (Insert)
      const savedUser = await UserRepository.save(userData);
      expect(savedUser).toBeDefined();
      expect(savedUser._id).toBe(TEST_USER_ID);
      expect(savedUser.email).toBe(userData.email);

      // Get by ID
      const retrieved = await UserRepository.getById(TEST_USER_ID);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Athlete');

      // Get by Email
      const retrievedByEmail = await UserRepository.getByEmail('TEST.ATHLETE@EXAMPLE.COM'); // Case-insensitivity check
      expect(retrievedByEmail).toBeDefined();
      expect(retrievedByEmail?._id).toBe(TEST_USER_ID);

      // Update
      const updatedData = {
        _id: TEST_USER_ID,
        email: 'test.athlete@example.com',
        name: 'Test Athlete Updated',
        role: 'athlete' as const
      };
      const updated = await UserRepository.save(updatedData);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Test Athlete Updated');

      // Delete
      await UserRepository.delete(TEST_USER_ID);
      const deleted = await UserRepository.getById(TEST_USER_ID);
      expect(deleted).toBeNull();
    });

    it('should reject invalid UUIDs or invalid emails', async () => {
      const invalidUser = new User({
        _id: 'not-a-uuid',
        email: 'invalid-email',
        name: 'Failure Test',
        role: 'athlete'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });
  });

  describe('3. CycleRepository & Cycle Model (UUID)', () => {
    it('should correctly save, find, and link Cycle to User', async () => {
      // Setup User first
      await UserRepository.save({
        _id: TEST_USER_ID,
        email: 'cycle.user@example.com',
        name: 'Cycle User',
        role: 'athlete'
      });

      const cycleData = {
        _id: TEST_CYCLE_ID,
        userId: TEST_USER_ID,
        name: 'Macrocycle 2026',
        description: 'First annual cycle',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'active' as const
      };

      const savedCycle = await CycleRepository.save(cycleData);
      expect(savedCycle).toBeDefined();
      expect(savedCycle._id).toBe(TEST_CYCLE_ID);

      // Find by User ID
      const cycles = await CycleRepository.getByUserId(TEST_USER_ID);
      expect(cycles.length).toBe(1);
      expect(cycles[0].name).toBe('Macrocycle 2026');

      // Cleanup
      await UserRepository.delete(TEST_USER_ID);
      await CycleRepository.delete(TEST_CYCLE_ID);
    });
  });

  describe('4. WorkoutRepository & Workout Model (UUID & Subdocuments)', () => {
    it('should save workout templates with embedded exercises without generating subdocument ObjectIds', async () => {
      const exerciseAssignmentId = '1234b76c-38fa-4e78-98e3-466d11ff3e43';
      const catalogExerciseId = 'fa7bf91a-be12-4217-bc22-cf8bb95b28da';

      const workoutData = {
        _id: TEST_WORKOUT_ID,
        userId: TEST_USER_ID,
        name: 'Heavy Upper Body',
        description: 'Focus on bench press and rows',
        targetDuration: 75,
        exercises: [
          {
            id: exerciseAssignmentId,
            exerciseId: catalogExerciseId,
            name: 'Bench Press',
            category: 'strength' as const,
            metrics: {
              sets: 4,
              reps: 8,
              weight: 80,
              restDuration: 120
            }
          }
        ]
      };

      const savedWorkout = await WorkoutRepository.save(workoutData);
      expect(savedWorkout).toBeDefined();
      expect(savedWorkout._id).toBe(TEST_WORKOUT_ID);
      expect(savedWorkout.exercises.length).toBe(1);
      expect(savedWorkout.exercises[0].id).toBe(exerciseAssignmentId);
      
      // Crucial Check: confirm that Mongoose DID NOT automatically append a _id to the subdocument exercise
      const rawDoc = savedWorkout.exercises[0].toObject();
      expect(rawDoc._id).toBeUndefined();

      // Retrieve
      const retrieved = await WorkoutRepository.getById(TEST_WORKOUT_ID);
      expect(retrieved).toBeDefined();
      expect(retrieved?.exercises[0].name).toBe('Bench Press');

      await WorkoutRepository.delete(TEST_WORKOUT_ID);
    });
  });

  describe('5. TrainingSessionRepository & TrainingSession Model (Complex UUID structure)', () => {
    it('should save training sessions with embedded timeblocks, exercises, and completed sets tracking', async () => {
      const blockId = 'aa49c445-6677-4566-a361-bbfbb9c24ea2';
      const exerciseId = 'bb49c445-6677-4566-a361-bbfbb9c24ea2';
      const catalogExerciseId = 'cc49c445-6677-4566-a361-bbfbb9c24ea2';

      const sessionData = {
        _id: TEST_SESSION_ID,
        userId: TEST_USER_ID,
        name: 'Leg Day Session #1',
        date: new Date('2026-05-19'),
        duration: 90,
        status: 'completed' as const,
        notes: 'Felt very strong today.',
        timeBlocks: [
          {
            id: blockId,
            name: 'Warmup Block',
            duration: 15,
            exercises: [
              {
                _id: exerciseId,
                exerciseId: catalogExerciseId,
                name: 'Goblet Squat',
                category: 'strength' as const,
                metrics: {
                  sets: 3,
                  reps: 12,
                  weight: 20
                },
                completedSets: [
                  { reps: 12, weight: 20, completed: true },
                  { reps: 12, weight: 20, completed: true },
                  { reps: 12, weight: 24, completed: true }
                ]
              }
            ]
          }
        ]
      };

      const saved = await TrainingSessionRepository.save(sessionData);
      expect(saved).toBeDefined();
      expect(saved._id).toBe(TEST_SESSION_ID);
      expect(saved.timeBlocks.length).toBe(1);
      expect(saved.timeBlocks[0].id).toBe(blockId);
      expect(saved.timeBlocks[0].exercises.length).toBe(1);
      expect(saved.timeBlocks[0].exercises[0]._id).toBe(exerciseId);
      expect(saved.timeBlocks[0].exercises[0].completedSets.length).toBe(3);
      expect(saved.timeBlocks[0].exercises[0].completedSets[2].weight).toBe(24);

      // Confirm subdocuments don't have _id auto-generated where we disabled it
      const blockRaw = saved.timeBlocks[0].toObject();
      expect(blockRaw._id).toBeUndefined();
      
      const exerciseRaw = saved.timeBlocks[0].exercises[0].toObject();
      expect(exerciseRaw._id).toBe(exerciseId); // Our klientské UUID _id should remain!
      expect(exerciseRaw.completedSets[0]._id).toBeUndefined(); // Completed sets should not have _id!

      // Fetch by range
      const sessionsInRange = await TrainingSessionRepository.getByDateRange(
        TEST_USER_ID,
        new Date('2026-05-18'),
        new Date('2026-05-20')
      );
      expect(sessionsInRange.length).toBe(1);
      expect(sessionsInRange[0].name).toBe('Leg Day Session #1');

      await TrainingSessionRepository.delete(TEST_SESSION_ID);
    });
  });
});
