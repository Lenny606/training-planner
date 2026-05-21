import Exercise from '../models/Exercise';
import { connectToDatabase } from '../connection';

export class ExerciseRepository {
  static async getAll() {
    await connectToDatabase();
    return Exercise.find({}).sort({ name: 1 });
  }

  static async getById(id: string) {
    await connectToDatabase();
    return Exercise.findById(id);
  }

  static async save(exerciseData: any) {
    await connectToDatabase();
    const existing = await Exercise.findById(exerciseData._id);
    if (existing) {
      return Exercise.findByIdAndUpdate(exerciseData._id, exerciseData, {
        returnDocument: 'after',
        runValidators: true
      });
    } else {
      const newExercise = new Exercise(exerciseData);
      return newExercise.save();
    }
  }

  static async delete(id: string) {
    await connectToDatabase();
    return Exercise.findByIdAndDelete(id);
  }
}
