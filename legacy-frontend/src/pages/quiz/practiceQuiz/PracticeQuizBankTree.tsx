import { type FC } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import type { IPublicCourse, IPublicQuizSection } from '../../../types/index';
import type { LocalAnswer, Subsection } from '../PracticeQuizPage';
import PracticeQuizSubsectionButton from './PracticeQuizSubsectionButton';

export interface PracticeQuizBankTreeProps {
  selectedCourseId: string | null;
  selectedCourse: IPublicCourse | null;
  selectedBankId: string | null;
  selectedSubsection: Subsection;
  sections: IPublicQuizSection[];
  treeLoading: boolean;
  expandedSections: string[];
  expandedBanks: string[];
  courseAnswers: Map<string, LocalAnswer>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleSection: (sectionId: string) => void;
  onToggleBank: (bankId: string) => void;
  onSelectBank: (bankId: string, sub: Subsection) => void;
  onResetAttempt: (bankId: string) => void;
}

const PracticeQuizBankTree: FC<PracticeQuizBankTreeProps> = ({
  selectedCourseId,
  selectedCourse,
  selectedBankId,
  selectedSubsection,
  sections,
  treeLoading,
  expandedSections,
  expandedBanks,
  courseAnswers,
  collapsed,
  onToggleCollapse,
  onToggleSection,
  onToggleBank,
  onSelectBank,
  onResetAttempt,
}) => {
  return (
    <Box
      sx={{
        width: collapsed ? 44 : 280,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        overflow: 'visible',
        bgcolor: 'background.paper',
        position: 'relative',
        zIndex: 3,
        transition: 'width 0.2s ease',
      }}
    >
      <Tooltip
        title={collapsed ? 'Expand quiz bank sidebar' : 'Collapse quiz bank sidebar'}
        placement='left'
      >
        <IconButton
          size='small'
          onClick={onToggleCollapse}
          sx={{
            position: 'absolute',
            top: 72,
            left: -38,
            zIndex: 6,
            width: 36,
            height: 36,
            borderRadius: '50%',
            color: 'common.white',
            bgcolor: 'primary.main',
            boxShadow: '0 8px 22px rgba(25, 118, 210, 0.36)',
            border: '2px solid',
            borderColor: 'background.paper',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateX(-2px) scale(1.12)',
              boxShadow: '0 12px 28px rgba(25, 118, 210, 0.46)',
            },
            animation: 'sidebarTogglePulse 2.4s ease-in-out infinite',
          }}
        >
          {collapsed ? (
            <ChevronLeftIcon sx={{ fontSize: 22 }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 22 }} />
          )}
        </IconButton>
      </Tooltip>
      {collapsed ? (
        <Box sx={{ flex: 1 }} />
      ) : (
        <>
          {/* Header */}
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
            }}
          >
            {selectedCourse ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {selectedCourse.title}
                  </Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {sections.reduce((acc, s) => acc + s.banks.length, 0)} quiz bank
                  {sections.reduce((acc, s) => acc + s.banks.length, 0) !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 700, flex: 1 }}>
                    Sections
                  </Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  Select a course
                </Typography>
              </>
            )}
          </Box>

          <Box sx={{ overflow: 'auto', height: 'calc(100% - 58px)' }}>
            {!selectedCourseId ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  px: 2,
                  gap: 1.5,
                  color: 'text.secondary',
                }}
              >
                <MenuBookOutlinedIcon sx={{ fontSize: 42, opacity: 0.18 }} />
                <Typography
                  variant='body2'
                  sx={{ textAlign: 'center', opacity: 0.5, fontSize: '0.82rem' }}
                >
                  Select a course from the left to see its free preview quizzes.
                </Typography>
              </Box>
            ) : treeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={24} />
              </Box>
            ) : sections.length === 0 ? (
              <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  No free preview quizzes in this course.
                </Typography>
              </Box>
            ) : (
              sections.map((section) => {
                const isSectionSelected = section.banks.some((bank) => bank._id === selectedBankId);
                return (
                  <Accordion
                    key={section._id}
                    expanded={expandedSections.includes(section._id)}
                    onChange={() => onToggleSection(section._id)}
                    elevation={0}
                    disableGutters
                    sx={{
                      bgcolor: isSectionSelected ? 'primary.50' : 'transparent',
                      borderBottom: '1px solid',
                      borderColor: isSectionSelected ? 'primary.light' : 'divider',
                      borderLeft: isSectionSelected ? '3px solid' : '3px solid transparent',
                      '&::before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        px: 2,
                        py: 0.75,
                        bgcolor: isSectionSelected ? 'rgba(25,118,210,0.1)' : 'grey.50',
                        minHeight: 44,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
                        <Typography
                          sx={{
                            fontWeight: isSectionSelected ? 800 : 600,
                            fontSize: '0.82rem',
                            lineHeight: 1.3,
                            color: isSectionSelected ? 'primary.main' : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {section.title}
                        </Typography>
                        {section.isFreePreview && (
                          <Chip
                            label='Free'
                            size='small'
                            color='success'
                            sx={{ fontSize: '0.62rem', height: 16, flexShrink: 0 }}
                          />
                        )}
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ p: 0 }}>
                      {section.banks.map((bank) => {
                        const isSelected = selectedBankId === bank._id;
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
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: isSelected ? 'primary.50' : 'rgba(0,0,0,0.01)',
                              },
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.82rem',
                                      lineHeight: 1.3,
                                      color: isSelected ? 'primary.main' : 'text.primary',
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {bank.title}
                                  </Typography>
                                  {bank.isFreePreview && !section.isFreePreview && (
                                    <Chip
                                      label='Free'
                                      size='small'
                                      color='success'
                                      sx={{ fontSize: '0.6rem', height: 15, flexShrink: 0 }}
                                    />
                                  )}
                                </Box>
                                {/* Detailed progress when collapsed */}
                                {!isBankExpanded && (bCorrect > 0 || bIncorrect > 0) && (
                                  <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <Box
                                      sx={{
                                        flex: 1,
                                        height: 4,
                                        bgcolor: 'action.hover',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: `${(bCorrect / bank.questions.length) * 100}%`,
                                          bgcolor: 'success.main',
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          width: `${(bIncorrect / bank.questions.length) * 100}%`,
                                          bgcolor: 'error.main',
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      variant='caption'
                                      sx={{
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        color: 'text.secondary',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        gap: 0.75,
                                      }}
                                    >
                                      <Box component='span' sx={{ color: 'success.main' }}>
                                        C:{bCorrect}
                                      </Box>
                                      <Box component='span' sx={{ color: 'error.main' }}>
                                        W:{bIncorrect}
                                      </Box>
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {bank.description && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{
                                    display: 'block',
                                    mt: 0.25,
                                    fontSize: '0.72rem',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {bank.description}
                                </Typography>
                              )}
                            </AccordionSummary>

                            <AccordionDetails sx={{ px: 2, pb: 1.25, pt: 0 }}>
                              <Stack sx={{ gap: 0.75 }}>
                                <PracticeQuizSubsectionButton
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
                                <PracticeQuizSubsectionButton
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
                                <PracticeQuizSubsectionButton
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
                      })}
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}

            {/* Buy card — shown when there are locked banks */}
          </Box>
        </>
      )}
    </Box>
  );
};

export default PracticeQuizBankTree;
