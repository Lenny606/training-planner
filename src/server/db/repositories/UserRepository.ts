import User from '../models/User';
import { connectToDatabase } from '../connection';

export class UserRepository {
  static async getById(id: string) {
    await connectToDatabase();
    return User.findById(id);
  }

  static async getByEmail(email: string) {
    await connectToDatabase();
    return User.findOne({ email: email.toLowerCase() });
  }

  static async save(userData: any) {
    await connectToDatabase();
    const existing = await User.findById(userData._id);
    if (existing) {
      return User.findByIdAndUpdate(userData._id, userData, {
        returnDocument: 'after',
        runValidators: true
      });
    } else {
      const newUser = new User(userData);
      return newUser.save();
    }
  }

  static async delete(id: string) {
    await connectToDatabase();
    return User.findByIdAndDelete(id);
  }
}
