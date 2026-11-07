import type { MetadataRoute } from 'next';

export const THEME_COLOR = '#1565c0';

/** Web app manifest: the site installs like an app (own icon, full screen without the browser bar). */
const manifest = (): MetadataRoute.Manifest => ({
  name: 'Ed-Tech Learning Platform',
  short_name: 'EdTech',
  description: 'Online courses, live classes, quizzes and study materials.',
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: THEME_COLOR,
  categories: ['education'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'My Courses',
      url: '/student/courses',
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
    },
    { name: 'Courses', url: '/courses', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
  ],
});

export default manifest;
