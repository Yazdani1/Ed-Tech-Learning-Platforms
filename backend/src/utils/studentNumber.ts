import { User, uniqueStudentNumber } from '../models/User.model';

/** Gives a student without a number (an older account, or one whose role was changed to Student) its number. */
export const ensureStudentNumber = async (userId: unknown): Promise<string | undefined> => {
	const user = await User.findById(userId).select('role studentNumber');
	if (!user || user.role !== 'Student') return undefined;
	if (user.studentNumber) return user.studentNumber;
	const studentNumber = await uniqueStudentNumber();
	await User.updateOne({ _id: user._id, studentNumber: { $exists: false } }, { $set: { studentNumber } });
	return (await User.findById(user._id).select('studentNumber').lean())?.studentNumber;
};

/** Startup: numbers for every student created before student numbers existed. */
export const assignMissingStudentNumbers = async (): Promise<number> => {
	const students = await User.find({ role: 'Student', studentNumber: { $exists: false } }).select('_id').lean();
	for (const student of students) await ensureStudentNumber(student._id);
	return students.length;
};
