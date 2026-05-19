import Cycle from '../models/Cycle';
import { connectToDatabase } from '../connection';

export class CycleRepository {
  static async getById(id: string) {
    await connectToDatabase();
    return Cycle.findById(id);
  }

  static async getByUserId(userId: string) {
    await connectToDatabase();
    return Cycle.find({ userId }).sort({ startDate: 1 });
  }

  static async save(cycleData: any) {
    await connectToDatabase();
    const existing = await Cycle.findById(cycleData._id);
    if (existing) {
      return Cycle.findByIdAndUpdate(cycleData._id, cycleData, {
        returnDocument: 'after',
        runValidators: true
      });
    } else {
      const newCycle = new Cycle(cycleData);
      return newCycle.save();
    }
  }

  static async delete(id: string) {
    await connectToDatabase();
    return Cycle.findByIdAndDelete(id);
  }
}
