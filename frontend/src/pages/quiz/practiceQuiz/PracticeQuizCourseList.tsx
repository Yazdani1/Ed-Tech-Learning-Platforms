import { type FC } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import type { IPublicCourse, ICategory, ICourseType } from '../../../types/index';

export interface PracticeQuizCourseListProps {
  courses: IPublicCourse[];
  coursesLoading: boolean;
  selectedCourseId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCourseType: string;
  onCourseTypeChange: (value: string) => void;
  selectedPricing: string;
  onPricingChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  categories: ICategory[];
  courseTypes: ICourseType[];
  onSelectCourse: (courseId: string, course: IPublicCourse) => void;
}

const PracticeQuizCourseList: FC<PracticeQuizCourseListProps> = ({
  courses,
  coursesLoading,
  selectedCourseId,
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCourseType,
  onCourseTypeChange,
  selectedPricing,
  onPricingChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  onClearFilters,
  categories,
  courseTypes,
  onSelectCourse,
}) => {
  return (
    <Box
      sx={{
        width: collapsed ? 44 : 300,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'visible',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 3,
        transition: 'width 0.2s ease',
      }}
    >
      <Tooltip
        title={collapsed ? 'Expand course list sidebar' : 'Collapse course list sidebar'}
        placement='right'
      >
        <IconButton
          size='small'
          onClick={onToggleCollapse}
          sx={{
            position: 'absolute',
            top: 72,
            right: -18,
            zIndex: 6,
            width: 36,
            height: 36,
            borderRadius: '50%',
            color: 'common.white',
            bgcolor: 'warning.main',
            boxShadow: '0 8px 22px rgba(245, 158, 11, 0.42)',
            border: '2px solid',
            borderColor: 'background.paper',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              bgcolor: 'warning.dark',
              transform: 'translateX(2px) scale(1.12)',
              boxShadow: '0 12px 28px rgba(245, 158, 11, 0.52)',
            },
            animation: 'sidebarTogglePulse 2.4s ease-in-out infinite',
          }}
        >
          {collapsed ? (
            <ChevronRightIcon sx={{ fontSize: 22 }} />
          ) : (
            <ChevronLeftIcon sx={{ fontSize: 22 }} />
          )}
        </IconButton>
      </Tooltip>
      {collapsed ? (
        <Box sx={{ flex: 1 }} />
      ) : (
        <>
          {/* Header & Filters */}
          <Box
            sx={{
              px: 2,
              py: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                    Browse Free Quizzes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.1 }}>
                  <Typography
                    variant='caption'
                    sx={{ fontSize: '0.68rem', lineHeight: 1.35, fontWeight: 700, color: 'primary.main' }}
                  >
                    {coursesLoading
                      ? 'Loading courses...'
                      : `${courses.length} course${courses.length === 1 ? '' : 's'}`}
                  </Typography>
                  <Typography variant='caption' sx={{ fontSize: '0.68rem', lineHeight: 1.35, color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{
                      fontSize: '0.68rem',
                      lineHeight: 1.35,
                      fontWeight: 700,
                      color: activeFilterCount > 0 ? 'warning.dark' : 'text.secondary',
                    }}
                  >
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`
                      : 'No active filters'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
                <Button
                  size='small'
                  variant={filtersOpen ? 'contained' : 'outlined'}
                  color='warning'
                  startIcon={<FilterListIcon sx={{ fontSize: '16px !important' }} />}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        fontSize: '17px !important',
                        transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  }
                  onClick={onToggleFilters}
                  sx={{
                    borderRadius: 0.5,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    minWidth: 0,
                    px: 1,
                    py: 0.35,
                  }}
                >
                  Filter
                </Button>
                {activeFilterCount > 0 && (
                  <Button
                    size='small'
                    onClick={onClearFilters}
                    sx={{ p: 0, minWidth: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Box>

            <Collapse in={filtersOpen} timeout='auto' unmountOnExit>
              <Stack spacing={1.5}>
                <TextField
                  size='small'
                  placeholder='Search courses...'
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 0.5, bgcolor: 'background.default' },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth size='small'>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                    >
                      <MenuItem value=''>All Categories</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size='small'>
                    <Select
                      value={selectedPricing}
                      onChange={(e) => onPricingChange(e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                    >
                      <MenuItem value=''>All Pricing</MenuItem>
                      <MenuItem value='Free'>Free Only</MenuItem>
                      <MenuItem value='Paid'>Paid Only</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <FormControl fullWidth size='small'>
                  <Select
                    value={selectedCourseType}
                    onChange={(e) => onCourseTypeChange(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                  >
                    <MenuItem value=''>All Course Types</MenuItem>
                    {courseTypes.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>
          </Box>

          <Box sx={{ overflow: 'auto', minHeight: 0, flex: 1 }}>
            {coursesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={22} />
              </Box>
            ) : courses.length === 0 ? (
              <Box sx={{ px: 2, py: 3 }}>
                <Typography variant='caption' color='text.secondary'>
                  No free preview quizzes available yet.
                </Typography>
              </Box>
            ) : (
              <List disablePadding sx={{ py: 2 }}>
                {courses.map((course) => {
                  const isSelected = selectedCourseId === course._id;
                  return (
                    <ListItemButton
                      key={course._id}
                      selected={isSelected}
                      onClick={() => onSelectCourse(course._id, course)}
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                        mx: 2,
                        borderRadius: 0.5,
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: isSelected ? 'rgba(245, 158, 11, 0.06)' : 'background.paper',
                        background: isSelected ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)' : 'background.paper',
                        position: 'relative',
                        overflow: 'hidden',
                        '&.Mui-selected': {
                          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            bgcolor: 'warning.main',
                          },
                        },
                        '&:hover': {
                          borderColor: 'warning.light',
                          transform: 'translateX(4px)',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                          bgcolor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.04)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 90,
                          height: 90,
                          flexShrink: 0,
                          borderRadius: 0.5,
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      >
                        <Box
                          component='img'
                          src={course.coverImage || 'https://via.placeholder.com/90x90?text=Course'}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease',
                            '.MuiListItemButton-root:hover &': {
                              transform: 'scale(1.1)',
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            mb: 0.5,
                            color: isSelected ? 'warning.dark' : 'text.primary',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {course.title}
                        </Typography>

                        {course.subtitle && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1,
                              fontSize: '0.72rem',
                            }}
                          >
                            {course.subtitle}
                          </Typography>
                        )}

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}
                        >
                          {course.pricing === 'Free' ? (
                            <Typography
                              sx={{ fontWeight: 800, color: 'success.main', fontSize: '0.85rem' }}
                            >
                              Free
                            </Typography>
                          ) : (
                            <>
                              <Typography
                                sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.9rem' }}
                              >
                                $
                                {course.discountPrice ??
                                  course.price ??
                                  course.listPrice ??
                                  0}
                              </Typography>
                              {course.discountPrice != null &&
                                (course.listPrice ?? course.price) != null && (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      textDecoration: 'line-through',
                                      color: 'text.disabled',
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    ${course.listPrice ?? course.price}
                                  </Typography>
                                )}
                            </>
                          )}
                          {course.includedInSubscription && (
                            <Chip
                              label='Sub'
                              size='small'
                              color='info'
                              variant='outlined'
                              sx={{
                                fontSize: '0.6rem',
                                height: 16,
                                borderRadius: 0.5,
                                fontWeight: 700,
                              }}
                            />
                          )}
                          {isSelected && (
                            <Box
                              sx={{
                                ml: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'success.main',
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 20 }} />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default PracticeQuizCourseList;
