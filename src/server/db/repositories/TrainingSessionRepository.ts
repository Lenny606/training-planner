import TrainingSession from '../models/TrainingSession';
import { connectToDatabase } from '../connection';

export class TrainingSessionRepository {
  static async getById(id: string) {
    await connectToDatabase();
    return TrainingSession.findById(id);
  }

  /**
   * Získá všechny tréninkové jednotky uživatele za dané období
   */
  static async getByDateRange(userId: string, startDate: Date, endDate: Date) {
    await connectToDatabase();
    return TrainingSession.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
  }

  /**
   * Bezpečně vytvoří nebo zaktualizuje tréninkovou jednotku
   * Klientská UUID vyžadují nejprve kontrolu existence (.findById)
   */
  static async save(sessionData: any) {
    await connectToDatabase();
    
    // Nejprve ověříme existenci podle klientského UUID
    const existing = await TrainingSession.findById(sessionData._id);
    
    if (existing) {
      // Provedeme UPDATE
      return TrainingSession.findByIdAndUpdate(sessionData._id, sessionData, {
        returnDocument: 'after',
        runValidators: true
      });
    } else {
      // Provedeme INSERT
      const newSession = new TrainingSession(sessionData);
      return newSession.save();
    }
  }

  /**
   * Odstraní tréninkovou jednotku podle ID
   */
  static async delete(id: string) {
    await connectToDatabase();
    return TrainingSession.findByIdAndDelete(id);
  }
}
