import Workout from '../models/Workout';
import { connectToDatabase } from '../connection';

export class WorkoutRepository {
  static async getById(id: string) {
    await connectToDatabase();
    return Workout.findById(id);
  }

  static async getByUserId(userId: string) {
    await connectToDatabase();
    return Workout.find({ userId }).sort({ createdAt: -1 });
  }

  static async save(workoutData: any) {
    await connectToDatabase();
    const existing = await Workout.findById(workoutData._id);
    if (existing) {
      return Workout.findByIdAndUpdate(workoutData._id, workoutData, {
        returnDocument: 'after',
        runValidators: true
      });
    } else {
      const newWorkout = new Workout(workoutData);
      return newWorkout.save();
    }
  }

  static async delete(id: string) {
    await connectToDatabase();
    return Workout.findByIdAndDelete(id);
  }
}
