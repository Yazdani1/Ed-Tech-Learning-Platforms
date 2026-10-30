'use client';

import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { coursesHref } from '../common/public-links';

/** Navbar search: opens the catalog (/courses?search=...) and mirrors the catalog's search text. */
export const NavSearch = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = pathname === '/courses' ? (searchParams.get('search') ?? '') : '';

  const [query, setQuery] = useState(urlSearch);
  const [syncedWith, setSyncedWith] = useState(urlSearch);
  // The catalog changed ?search= itself (its own search box): show the same text here
  if (syncedWith !== urlSearch) {
    setSyncedWith(urlSearch);
    setQuery(urlSearch);
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    router.push(coursesHref({ search: query.trim() }));
  };

  return (
    <Box
      component="form"
      role="search"
      onSubmit={handleSubmit}
      sx={{ flex: 1, minWidth: 0, maxWidth: 520, mx: 'auto' }}
    >
      <TextField
        size="small"
        fullWidth
        type="search"
        placeholder={t('public.nav.searchPlaceholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        slotProps={{
          htmlInput: { 'aria-label': t('public.nav.searchLabel') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5, bgcolor: 'grey.50', minHeight: 44 } }}
      />
    </Box>
  );
};
