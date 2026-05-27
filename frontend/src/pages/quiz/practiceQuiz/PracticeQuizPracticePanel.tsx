import { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AppPagination from '../../../components/common/AppPagination';
import type { IPublicCourse, IQuizBank, IQuizQuestion } from '../../../types/index';
import type { LocalAnswer, Subsection } from '../PracticeQuizPage';
import PracticeCard from './PracticeCard';

export interface PracticeQuizPracticePanelProps {
  selectedCourseId: string | null;
  selectedBankId: string | null;
  selectedBank: IQuizBank | null;
  selectedCourse: IPublicCourse | null;
  selectedSubsection: Subsection;
  activeQuestions: IQuizQuestion[];
  currentPage: number;
  currentQuestion: IQuizQuestion | null;
  selectedOptions: number[];
  isChecked: boolean;
  submitting: boolean;
  attemptLoading: boolean;
  isLoggedIn: boolean;
  allBanks: IQuizBank[];
  lockedBankCount: number;
  courseAnswers: Map<string, LocalAnswer>;
  totalQ: number;
  correctCount: number;
  incorrectCount: number;
  progressPct: number;
  courseTotalQ: number;
  courseTotalCorrect: number;
  courseTotalIncorrect: number;
  courseTotalAnswered: number;
  courseTotalRemaining: number;
  courseProgressPct: number;
  onSetCurrentPage: (page: number) => void;
  onToggleOption: (idx: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  onResetAttempt: (bankId?: string) => void;
}

const PracticeQuizPracticePanel: FC<PracticeQuizPracticePanelProps> = ({
  selectedCourseId,
  selectedBankId,
  selectedBank,
  selectedCourse,
  selectedSubsection,
  activeQuestions,
  currentPage,
  currentQuestion,
  selectedOptions,
  isChecked,
  submitting,
  attemptLoading,
  isLoggedIn,
  allBanks,
  lockedBankCount,
  courseAnswers,
  totalQ,
  correctCount,
  incorrectCount,
  progressPct,
  courseTotalQ,
  courseTotalCorrect,
  courseTotalIncorrect,
  courseTotalAnswered,
  courseTotalRemaining,
  courseProgressPct,
  onSetCurrentPage,
  onToggleOption,
  onCheck,
  onNext,
  onSkip,
  onResetAttempt,
}) => {
  return (
    <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Horizontal course info bar — shown whenever a course is selected */}
      {selectedCourseId && (
        <Box
          sx={{
            px: 2,
            py: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            minHeight: 56,
          }}
        >
          {/* Cover image */}
          <Box
            component='img'
            src={selectedCourse?.coverImage || 'https://via.placeholder.com/72x44?text=Course'}
            sx={{ width: 72, height: 44, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0, border: '1px solid', borderColor: 'divider' }}
          />

          {/* Course title + subtitle */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCourse?.title ?? 'Loading...'}
            </Typography>
            {selectedCourse?.subtitle && (
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {selectedCourse.subtitle}
              </Typography>
            )}
          </Box>

          <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', flexShrink: 0 }} />

          {/* Total quiz count */}
          <Box sx={{ flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.25 }}>
              Total Quiz
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                {allBanks.length + lockedBankCount}
              </Typography>
              {lockedBankCount > 0 && (
                <Chip
                  label={`${lockedBankCount} locked`}
                  size='small'
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    bgcolor: 'error.50',
                    color: 'error.main',
                    border: '1px solid',
                    borderColor: 'error.200',
                    borderRadius: 0.5,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', flexShrink: 0 }} />

          {/* Price */}
          <Box sx={{ flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.25 }}>
              Price
            </Typography>
            {selectedCourse?.pricing === 'Free' ? (
              <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: 'success.main' }}>Free</Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: 'text.primary' }}>
                  ${selectedCourse?.discountPrice ?? selectedCourse?.price ?? selectedCourse?.listPrice ?? '—'}
                </Typography>
                {(selectedCourse?.discountPercent ?? 0) > 0 && (
                  <Chip
                    label={`-${selectedCourse?.discountPercent}%`}
                    size='small'
                    color='error'
                    sx={{ fontWeight: 900, borderRadius: 0.5, height: 16, fontSize: '0.58rem', '& .MuiChip-label': { px: 0.6 } }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Unlock / View Course button */}
          <Button
            variant='contained'
            size='small'
            color={lockedBankCount > 0 ? 'warning' : 'primary'}
            component={RouterLink}
            to={`/courses/${selectedCourseId}`}
            startIcon={lockedBankCount > 0
              ? <LockOutlinedIcon sx={{ fontSize: '14px !important' }} />
              : <LockOpenOutlinedIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ fontWeight: 800, borderRadius: 0.5, textTransform: 'none', fontSize: '0.78rem', py: 0.5, px: 1.5, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {lockedBankCount > 0 ? 'Unlock Course' : 'View Course'}
          </Button>
        </Box>
      )}

      {/* Body: progress card (auto height) + quiz content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Progress Stats Card — auto height, sits at top */}
        {selectedCourseId && courseTotalQ > 0 && (
          <Box
            sx={{
              width: 148,
              flexShrink: 0,
              alignSelf: 'flex-start',
              mt: 1.5,
              ml: 1.5,
              mr: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Course stats */}
            <Box sx={{ px: 1.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1 }}>
                Course
              </Typography>
              <Box sx={{ height: 4, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
                <Box sx={{ width: `${(courseTotalCorrect / courseTotalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                <Box sx={{ width: `${(courseTotalIncorrect / courseTotalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
              </Box>
              {[
                { label: 'Total', value: courseTotalQ, color: 'text.primary' },
                { label: 'Answered', value: courseTotalAnswered, color: 'primary.main' },
                { label: 'Correct', value: courseTotalCorrect, color: 'success.main' },
                { label: 'Incorrect', value: courseTotalIncorrect, color: 'error.main' },
                { label: 'Remaining', value: courseTotalRemaining, color: 'warning.main' },
              ].map(({ label, value, color }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color }}>{value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 0.75 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>Accuracy</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: 'primary.main' }}>{courseProgressPct}%</Typography>
              </Box>
            </Box>

            {/* Bank stats */}
            {selectedBankId && selectedBank && totalQ > 0 && (
              <Box sx={{ px: 1.5, py: 1.75 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Quiz Bank
                </Typography>
                <Box sx={{ height: 4, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
                  <Box sx={{ width: `${(correctCount / totalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                  <Box sx={{ width: `${(incorrectCount / totalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
                </Box>
                {[
                  { label: 'Total', value: totalQ, color: 'text.primary' },
                  { label: 'Answered', value: correctCount + incorrectCount, color: 'primary.main' },
                  { label: 'Correct', value: correctCount, color: 'success.main' },
                  { label: 'Incorrect', value: incorrectCount, color: 'error.main' },
                  { label: 'Remaining', value: totalQ - (correctCount + incorrectCount), color: 'warning.main' },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 0.75 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>Accuracy</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: 'success.main' }}>{progressPct}%</Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Scrollable quiz content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {!selectedBankId ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                p: 4,
                color: 'text.secondary',
              }}
            >
              <QuizOutlinedIcon sx={{ fontSize: 84, opacity: 0.12 }} />
              <Typography variant='h6' sx={{ fontWeight: 700, opacity: 0.3 }}>
                {!selectedCourseId
                  ? 'Select a course and quiz to start practising'
                  : 'Select a quiz from the panel to start'}
              </Typography>
              {!isLoggedIn && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1,
                    px: 2.5,
                    py: 1.25,
                    bgcolor: 'info.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'info.200',
                    maxWidth: 440,
                  }}
                >
                  <LockOpenOutlinedIcon fontSize='small' color='info' />
                  <Typography variant='body2' color='info.dark'>
                    Sign in to save your progress and track wrong / correct answers.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ p: { xs: 1.5, md: 2 }, maxWidth: 760, mx: 'auto' }}>
              {/* Bank title + subsection badge */}
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedBank?.title}
                  </Typography>
                  {selectedBank?.description && (
                    <Typography variant='body2' color='text.secondary'>
                      {selectedBank.description}
                    </Typography>
                  )}
                </Box>
                {(correctCount + incorrectCount) > 0 && (
                  <Tooltip title='Reset all answers for this quiz bank' placement='left'>
                    <IconButton
                      size='small'
                      onClick={() => onResetAttempt()}
                      sx={{ flexShrink: 0, mt: 0.5, color: 'text.primary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {isLoggedIn && attemptLoading && (
                <Box sx={{ mb: 1.5 }}>
                  <CircularProgress size={20} />
                </Box>
              )}

              {/* Empty subsection */}
              {activeQuestions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                  <Typography>
                    {selectedSubsection === 'incorrect'
                      ? 'No incorrect answers yet — keep practising!'
                      : selectedSubsection === 'correct'
                      ? 'No correct answers yet — keep going!'
                      : 'No questions in this quiz bank.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant='h6' sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        component='span'
                        sx={{
                          px: 1.25,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          color: 'white',
                          bgcolor:
                            selectedSubsection === 'all'
                              ? 'common.black'
                              : selectedSubsection === 'incorrect'
                              ? 'error.main'
                              : 'success.main',
                        }}
                      >
                        {selectedSubsection === 'all'
                          ? 'All Questions'
                          : selectedSubsection === 'incorrect'
                          ? 'Incorrect Questions'
                          : 'Correct Questions'}
                      </Box>
                      <Typography
                        component='span'
                        variant='h6'
                        sx={{ fontWeight: 800, color: 'text.secondary', ml: 0.5 }}
                      >
                        ({activeQuestions.length})
                      </Typography>
                    </Typography>
                  </Box>

                  {currentQuestion && (
                    <PracticeCard
                      question={currentQuestion}
                      questionNumber={currentPage + 1}
                      totalQuestions={activeQuestions.length}
                      selectedOptions={selectedOptions}
                      isChecked={isChecked}
                      submitting={submitting}
                      onToggleOption={onToggleOption}
                      onCheck={onCheck}
                      onNext={onNext}
                      onSkip={onSkip}
                      isLastQuestion={currentPage >= activeQuestions.length - 1}
                    />
                  )}

                  <AppPagination
                    page={currentPage + 1}
                    totalPages={activeQuestions.length}
                    totalItems={activeQuestions.length}
                    pageSize={1}
                    onChange={(p) => onSetCurrentPage(p - 1)}
                    align='space-between'
                    getItemSx={(pageNo) => {
                      const qIndex = pageNo - 1;
                      const q = activeQuestions[qIndex];
                      if (!q) return {};

                      const ans = courseAnswers.get(q._id);
                      const isAnswered = ans && ans.selectedOptionIndices.length > 0;

                      if (isAnswered) {
                        const baseColor = ans.isCorrect ? '#22c55e' : '#ef4444';
                        const hoverColor = ans.isCorrect ? '#16a34a' : '#dc2626';
                        return {
                          bgcolor: `${baseColor} !important`,
                          color: 'white !important',
                          '&:hover': { bgcolor: `${hoverColor} !important` },
                          ...(pageNo === currentPage + 1 && {
                            border: '3px solid',
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 1px white inset',
                          }),
                        };
                      }
                      return {};
                    }}
                  />
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PracticeQuizPracticePanel;
