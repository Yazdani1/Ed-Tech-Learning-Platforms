import type { FC } from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { IQuizSection, IQuizBank } from '../../../types/index';
import ItemActionMenu from '../../common/ItemActionMenu';
import SubsectionProgressButton from './SubsectionProgressButton';

export type Subsection = 'all' | 'incorrect' | 'correct';
export type LocalAnswer = { selectedOptionIndices: number[]; isCorrect: boolean };

interface QuizBankSidebarProps {
	canPost: boolean;
	quizSections: IQuizSection[];
	quizBanks: IQuizBank[];
	selectedBankId: string | null;
	selectedSubsection: Subsection;
	managingBankId: string | null;
	expandedSections: string[];
	expandedBanks: string[];
	courseAnswers: Map<string, LocalAnswer>;
	// Section form state
	showCreateSection: boolean;
	createSecForm: { title: string };
	creatingSec: boolean;
	editingSecId: string | null;
	editSecForm: { title: string };
	editingSecLoading: boolean;
	// Bank form state
	createBankSectionId: string | null;
	createBankForm: { title: string; description: string };
	creatingBank: boolean;
	editingBankId: string | null;
	editBankForm: { title: string; description: string };
	editingBankLoading: boolean;
	// callbacks
	onToggleSection: (id: string) => void;
	onToggleBank: (id: string) => void;
	onSelectBank: (bankId: string, sub: Subsection) => void;
	onManage: (bankId: string) => void;
	onSetShowCreateSection: React.Dispatch<React.SetStateAction<boolean>>;
	onSetCreateSecForm: React.Dispatch<React.SetStateAction<{ title: string }>>;
	onCreateSection: () => void;
	onSetEditingSecId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditSecForm: React.Dispatch<React.SetStateAction<{ title: string }>>;
	onUpdateSection: () => void;
	onDeleteSection: (secId: string) => void;
	onToggleSectionPreview: (secId: string, current: boolean) => void;
	onToggleBankPreview: (bankId: string, current: boolean) => void;
	onSetCreateBankSectionId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetCreateBankForm: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
	onCreateBank: (sectionId: string) => void;
	onDeleteBank: (bankId: string) => void;
	onSetEditingBankId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditBankForm: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
	onUpdateBank: () => void;
	onResetAttempt: (bankId: string) => void;
}

const QuizBankSidebar: FC<QuizBankSidebarProps> = ({
	canPost,
	quizSections,
	quizBanks,
	selectedBankId,
	selectedSubsection,
	managingBankId,
	expandedSections,
	expandedBanks,
	courseAnswers,
	showCreateSection,
	createSecForm,
	creatingSec,
	editingSecId,
	editSecForm,
	editingSecLoading,
	createBankSectionId,
	createBankForm,
	creatingBank,
	onToggleSection,
	onToggleBank,
	onSelectBank,
	onManage,
	onSetShowCreateSection,
	onSetCreateSecForm,
	onCreateSection,
	onSetEditingSecId,
	onSetEditSecForm,
	onUpdateSection,
	onDeleteSection,
	onToggleSectionPreview,
	onToggleBankPreview,
	onSetCreateBankSectionId,
	onSetCreateBankForm,
	onCreateBank,
	onDeleteBank,
	onSetEditingBankId,
	onSetEditBankForm,
	onResetAttempt,
}) => {
	return (
		<Box
			sx={{
				width: canPost ? 270 : 380,
				...(canPost
					? { borderRight: '1px solid' }
					: { borderLeft: '1px solid', order: 2 }),
				borderColor: 'divider',
				overflow: 'auto',
				flexShrink: 0,
				bgcolor: 'background.paper',
			}}
		>
			<Box
				sx={{
					px: 2,
					py: 1.5,
					borderBottom: '1px solid',
					borderColor: 'divider',
					position: 'sticky',
					top: 0,
					bgcolor: 'background.paper',
					zIndex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Box>
					<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
						Quiz Bank
					</Typography>
					<Typography variant='caption' color='text.secondary'>
						{quizSections.length} section
						{quizSections.length !== 1 ? 's' : ''}
					</Typography>
				</Box>
				{canPost && (
					<Tooltip title='Add section'>
						<IconButton
							size='small'
							onClick={() => {
								onSetShowCreateSection((p) => !p);
								onSetCreateSecForm({ title: '' });
							}}
						>
							<AddIcon fontSize='small' />
						</IconButton>
					</Tooltip>
				)}
			</Box>

			{/* Create section form */}
			{canPost && showCreateSection && (
				<Box
					sx={{
						px: 2,
						py: 1.5,
						borderBottom: '1px solid',
						borderColor: 'divider',
					}}
				>
					<TextField
						label='Section title'
						value={createSecForm.title}
						onChange={(e) => onSetCreateSecForm({ title: e.target.value })}
						fullWidth
						size='small'
						sx={{ mb: 1 }}
						autoFocus
					/>
					<Stack direction='row' spacing={1}>
						<Button size='small' onClick={() => onSetShowCreateSection(false)}>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							onClick={onCreateSection}
							disabled={creatingSec}
						>
							{creatingSec ? <CircularProgress size={14} /> : 'Create'}
						</Button>
					</Stack>
				</Box>
			)}

			{quizSections.length === 0 ? (
				<Box sx={{ px: 2, py: 3 }}>
					<Typography variant='caption' color='text.secondary'>
						{canPost
							? 'No sections yet. Click + to add one.'
							: 'No quiz sections in this course yet.'}
					</Typography>
				</Box>
			) : (
				quizSections.map((section) => {
					const banks = quizBanks.filter(
						(b) => b.quizSection === section._id,
					);
					const hasActiveBank = banks.some(
						(b) => b._id === selectedBankId || b._id === managingBankId,
					);
					const isSectionExpanded = canPost
						? true
						: expandedSections.includes(section._id);
					return (
						<Accordion
							key={section._id}
							expanded={isSectionExpanded}
							onChange={canPost ? undefined : () => onToggleSection(section._id)}
							elevation={0}
							disableGutters
							sx={{
								bgcolor: hasActiveBank
									? 'rgba(25,118,210,0.03)'
									: 'transparent',
								borderBottom: '1px solid',
								borderColor: hasActiveBank ? 'primary.200' : 'divider',
								...(!canPost && hasActiveBank && {
									borderLeft: '3px solid',
									borderLeftColor: 'primary.main',
								}),
								'&::before': { display: 'none' },
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
								sx={{
									px: 2,
									py: 0.75,
									bgcolor: hasActiveBank
										? 'rgba(25,118,210,0.09)'
										: 'grey.50',
									minHeight: 44,
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										width: '100%',
										pr: 0.5,
									}}
								>
									{editingSecId === section._id ? (
										<Box
											sx={{ flex: 1, mr: 1 }}
											onClick={(e) => e.stopPropagation()}
										>
											<TextField
												value={editSecForm.title}
												onChange={(e) =>
													onSetEditSecForm({ title: e.target.value })
												}
												size='small'
												fullWidth
												sx={{ mb: 0.5 }}
												autoFocus
												onKeyDown={(e) => {
													if (e.key === 'Enter') onUpdateSection();
													if (e.key === 'Escape') onSetEditingSecId(null);
												}}
											/>
											<Stack direction='row' spacing={0.5}>
												<Button
													size='small'
													onClick={() => onSetEditingSecId(null)}
													sx={{
														minWidth: 0,
														px: 1,
														py: 0.25,
														fontSize: '0.7rem',
													}}
												>
													Cancel
												</Button>
												<Button
													size='small'
													variant='contained'
													onClick={onUpdateSection}
													disabled={editingSecLoading}
													sx={{
														minWidth: 0,
														px: 1,
														py: 0.25,
														fontSize: '0.7rem',
													}}
												>
													{editingSecLoading ? (
														<CircularProgress size={12} />
													) : (
														'Save'
													)}
												</Button>
											</Stack>
										</Box>
									) : (
										<Typography
											sx={{
												fontWeight: 600,
												fontSize: '0.82rem',
												lineHeight: 1.3,
											}}
										>
											{section.title}
										</Typography>
									)}
									{canPost && editingSecId !== section._id && (
										<Box
											onClick={(e) => e.stopPropagation()}
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 0.25,
											}}
										>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ fontSize: '0.68rem' }}
											>
												Free
											</Typography>
											<Switch
												size='small'
												checked={section.isFreePreview}
												onChange={() =>
													onToggleSectionPreview(
														section._id,
														section.isFreePreview,
													)
												}
												color='success'
												sx={{ transform: 'scale(0.8)', mx: -0.5 }}
											/>
											<ItemActionMenu
												actions={[
													{
														label: 'Rename',
														icon: (
															<EditOutlinedIcon
																fontSize='small'
																sx={{ mr: 1 }}
															/>
														),
														onClick: () => {
															onSetEditingSecId(section._id);
															onSetEditSecForm({ title: section.title });
														},
													},
													{
														label: 'Delete',
														color: 'error',
														icon: (
															<DeleteOutlinedIcon
																fontSize='small'
																sx={{ mr: 1 }}
															/>
														),
														onClick: () =>
															onDeleteSection(section._id),
													},
												]}
											/>
										</Box>
									)}
								</Box>
							</AccordionSummary>

							<AccordionDetails sx={{ p: 0 }}>
								{banks.length === 0 && !canPost && (
									<Box sx={{ px: 2, py: 1.5 }}>
										<Typography variant='caption' color='text.secondary'>
											No quiz banks yet.
										</Typography>
									</Box>
								)}

								{banks.map((bank) => {
									const isSelected = selectedBankId === bank._id;
									const isManaging = managingBankId === bank._id;

									if (!canPost) {
										// ── Student view: nested accordion + SubsectionProgressButton ──
										const isBankExpanded = expandedBanks.includes(bank._id);
										const bCorrect = bank.questions.filter(
											(q) => courseAnswers.get(q._id)?.isCorrect,
										).length;
										const bIncorrect = bank.questions.filter((q) => {
											const a = courseAnswers.get(q._id);
											return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
										}).length;

										return (
											<Accordion
												key={bank._id}
												expanded={isBankExpanded}
												onChange={() => onToggleBank(bank._id)}
												elevation={0}
												disableGutters
												sx={{
													mb: 1.25,
													mx: 1.5,
													borderRadius: '8px !important',
													border: '1.5px solid',
													borderColor: isSelected ? 'primary.main' : 'divider',
													bgcolor: isSelected ? 'primary.50' : 'background.paper',
													overflow: 'hidden',
													'&::before': { display: 'none' },
													transition: 'all 0.15s ease',
													'&:hover': { borderColor: 'primary.main' },
												}}
											>
												<AccordionSummary
													expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
													sx={{
														px: 2,
														py: 0.5,
														minHeight: 0,
														'& .MuiAccordionSummary-content': {
															my: 1,
															display: 'block',
															overflow: 'hidden',
														},
													}}
												>
													<Box sx={{ width: '100%', mr: 1 }}>
														<Typography
															sx={{
																fontWeight: 600,
																fontSize: '0.82rem',
																lineHeight: 1.3,
																color: isSelected ? 'primary.main' : 'text.primary',
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
														>
															{bank.title}
														</Typography>
														{!isBankExpanded && (bCorrect > 0 || bIncorrect > 0) && (
															<Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
																<Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
																	<Box sx={{ width: `${(bCorrect / bank.questions.length) * 100}%`, bgcolor: 'success.main' }} />
																	<Box sx={{ width: `${(bIncorrect / bank.questions.length) * 100}%`, bgcolor: 'error.main' }} />
																</Box>
																<Typography variant='caption' sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', display: 'flex', gap: 0.75 }}>
																	<Box component='span' sx={{ color: 'success.main' }}>C:{bCorrect}</Box>
																	<Box component='span' sx={{ color: 'error.main' }}>W:{bIncorrect}</Box>
																</Typography>
															</Box>
														)}
														{bank.description && (
															<Typography
																variant='caption'
																color='text.secondary'
																sx={{ display: 'block', mt: 0.25, fontSize: '0.72rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
															>
																{bank.description}
															</Typography>
														)}
													</Box>
												</AccordionSummary>

												<AccordionDetails sx={{ px: 2, pb: 1.25, pt: 0 }}>
													<Stack sx={{ gap: 0.75 }}>
														<SubsectionProgressButton
															label='All'
															count={bank.questions.length}
															total={bank.questions.length}
															correct={bCorrect}
															incorrect={bIncorrect}
															progressValue={bCorrect + bIncorrect}
															progressText={`${bCorrect + bIncorrect}/${bank.questions.length} answered`}
															color='primary'
															selected={isSelected && selectedSubsection === 'all'}
															onClick={() => onSelectBank(bank._id, 'all')}
														/>
														<SubsectionProgressButton
															label='Wrong'
															count={bIncorrect}
															total={bank.questions.length}
															correct={bCorrect}
															incorrect={bIncorrect}
															progressValue={bIncorrect}
															progressText={`${bIncorrect}/${bank.questions.length} wrong`}
															color='error'
															selected={isSelected && selectedSubsection === 'incorrect'}
															onClick={() => onSelectBank(bank._id, 'incorrect')}
														/>
														<SubsectionProgressButton
															label='Correct'
															count={bCorrect}
															total={bank.questions.length}
															correct={bCorrect}
															incorrect={bIncorrect}
															progressValue={bCorrect}
															progressText={`${bCorrect}/${bank.questions.length} correct`}
															color='success'
															selected={isSelected && selectedSubsection === 'correct'}
															onClick={() => onSelectBank(bank._id, 'correct')}
														/>
													</Stack>
													{(bCorrect + bIncorrect) > 0 && (
														<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
															<Tooltip title='Reset progress for this quiz bank' placement='top'>
																<IconButton
																	size='small'
																	onClick={(e) => { e.stopPropagation(); onResetAttempt(bank._id); }}
																	sx={{ color: 'text.primary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
																>
																	<RefreshIcon sx={{ fontSize: 15 }} />
																</IconButton>
															</Tooltip>
														</Box>
													)}
												</AccordionDetails>
											</Accordion>
										);
									}

									// ── Admin/Teacher view: flat box with manage controls ──
									return (
										<Box
											key={bank._id}
											sx={{
												borderTop: '1px solid',
												borderColor: 'divider',
												bgcolor: isManaging
													? 'rgba(245,158,11,0.08)'
													: isSelected
														? 'primary.50'
														: 'background.paper',
											}}
										>
											<Box
												sx={{
													px: 2,
													pt: 1.25,
													pb: 0.75,
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'flex-start',
													gap: 0.5,
												}}
												onClick={() => onManage(bank._id)}
											>
												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Typography
														sx={{
															fontWeight: 600,
															fontSize: '0.82rem',
															lineHeight: 1.3,
															color: isManaging
																? 'warning.dark'
																: isSelected
																	? 'primary.main'
																	: 'text.primary',
														}}
													>
														{bank.title}
													</Typography>
													{bank.description && (
														<Typography
															variant='caption'
															color='text.secondary'
															sx={{
																display: 'block',
																mt: 0.25,
																lineHeight: 1.3,
																fontSize: '0.72rem',
															}}
														>
															{bank.description}
														</Typography>
													)}
												</Box>

												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 0.25,
														flexShrink: 0,
														mt: 0.1,
													}}
													onClick={(e) => e.stopPropagation()}
												>
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ fontSize: '0.68rem' }}
													>
														Free
													</Typography>
													<Switch
														size='small'
														checked={bank.isFreePreview}
														onChange={() =>
															onToggleBankPreview(
																bank._id,
																bank.isFreePreview,
															)
														}
														color='success'
														sx={{ transform: 'scale(0.8)', mx: -0.5 }}
													/>
													<ItemActionMenu
														actions={[
															{
																label: 'Edit',
																icon: (
																	<EditOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () => {
																	onSetEditingBankId(bank._id);
																	onSetEditBankForm({
																		title: bank.title,
																		description: bank.description ?? '',
																	});
																	onManage(bank._id);
																},
															},
															{
																label: 'Delete',
																color: 'error',
																icon: (
																	<DeleteOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () =>
																	onDeleteBank(bank._id),
															},
														]}
													/>
												</Box>
											</Box>
										</Box>
									);
								})}

								{/* Add quiz bank button (canPost only) */}
								{canPost && (
									<Box sx={{ px: 2, py: 1 }}>
										{createBankSectionId === section._id ? (
											<Box>
												<TextField
													label='Bank title'
													value={createBankForm.title}
													onChange={(e) =>
														onSetCreateBankForm((p) => ({
															...p,
															title: e.target.value,
														}))
													}
													fullWidth
													size='small'
													sx={{ mb: 1 }}
													autoFocus
												/>
												<TextField
													label='Description (optional)'
													value={createBankForm.description}
													onChange={(e) =>
														onSetCreateBankForm((p) => ({
															...p,
															description: e.target.value,
														}))
													}
													fullWidth
													size='small'
													multiline
													minRows={2}
													sx={{ mb: 1 }}
												/>
												<Stack direction='row' spacing={1}>
													<Button
														size='small'
														onClick={() => onSetCreateBankSectionId(null)}
													>
														Cancel
													</Button>
													<Button
														size='small'
														variant='contained'
														onClick={() => onCreateBank(section._id)}
														disabled={creatingBank}
													>
														{creatingBank ? (
															<CircularProgress size={14} />
														) : (
															'Create'
														)}
													</Button>
												</Stack>
											</Box>
										) : (
											<Button
												size='small'
												startIcon={<AddIcon />}
												onClick={() => {
													onSetCreateBankSectionId(section._id);
													onSetCreateBankForm({ title: '', description: '' });
												}}
											>
												Add Quiz Bank
											</Button>
										)}
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					);
				})
			)}
		</Box>
	);
};

export default QuizBankSidebar;
