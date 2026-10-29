import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { formatDateTime } from '../../../utils/dateTime';
import type { ICourseStudentEnrollment } from '../../../types/index';
import AppPagination from '../../../components/common/AppPagination';

interface CourseLearningStudentsTabProps {
	courseStudents: ICourseStudentEnrollment[];
	studentsLoading: boolean;
	studentsExporting: boolean;
	canExportStudentList: boolean;
	userRole: string | undefined;
	studentsPage: number;
	pageSize: number;
	onExport: () => void;
	onPageChange: (page: number) => void;
}

const CourseLearningStudentsTab: FC<CourseLearningStudentsTabProps> = ({
	courseStudents,
	studentsLoading,
	studentsExporting,
	canExportStudentList,
	userRole,
	studentsPage,
	pageSize,
	onExport,
	onPageChange,
}) => {
	return (
		<Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 980 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: { xs: 'flex-start', sm: 'center' },
					gap: 2,
					mb: 3,
					flexDirection: { xs: 'column', sm: 'row' },
				}}
			>
				<Box>
					<Typography variant='h5' sx={{ fontWeight: 700 }}>
						Enrolled Students ({courseStudents.length})
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						Students currently enrolled in this course.
					</Typography>
				</Box>
				{canExportStudentList && (
					<Button
						variant='contained'
						startIcon={
							studentsExporting ? (
								<CircularProgress size={16} color='inherit' />
							) : (
								<DownloadOutlinedIcon />
							)
						}
						onClick={onExport}
						disabled={studentsExporting || courseStudents.length === 0}
					>
						Export CSV
					</Button>
				)}
			</Box>

			<Paper
				elevation={0}
				sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
			>
				{studentsLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
						<CircularProgress size={28} />
					</Box>
				) : courseStudents.length === 0 ? (
					<Box sx={{ py: 6, textAlign: 'center' }}>
						<Typography color='text.secondary'>
							No students enrolled in this course yet.
						</Typography>
					</Box>
				) : (
					<Box>
						<TableContainer>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
										{userRole !== 'Teacher' && (
											<TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
										)}
										<TableCell sx={{ fontWeight: 700 }}>Enroll Date</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{courseStudents
										.slice(
											(studentsPage - 1) * pageSize,
											studentsPage * pageSize,
										)
										.map((enrollment) => (
											<TableRow key={enrollment._id} hover>
												<TableCell>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1.5,
														}}
													>
														<Avatar
															src={enrollment.student.avatar}
															sx={{ width: 32, height: 32, fontSize: 13 }}
														>
															{enrollment.student.name?.[0]}
														</Avatar>
														<Typography
															variant='body2'
															sx={{ fontWeight: 600 }}
														>
															{enrollment.student.name}
														</Typography>
													</Box>
												</TableCell>
												{userRole !== 'Teacher' && (
													<TableCell>
														<Typography
															variant='body2'
															color='text.secondary'
														>
															{enrollment.student.email ?? '-'}
														</Typography>
													</TableCell>
												)}
												<TableCell>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														{formatDateTime(enrollment.createdAt)}
													</Typography>
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</TableContainer>
						<AppPagination
							page={studentsPage}
							totalPages={Math.ceil(courseStudents.length / pageSize)}
							totalItems={courseStudents.length}
							pageSize={pageSize}
							onChange={onPageChange}
							align='center'
						/>
					</Box>
				)}
			</Paper>
		</Box>
	);
};

export default CourseLearningStudentsTab;
