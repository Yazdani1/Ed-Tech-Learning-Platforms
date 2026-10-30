// Every translation, per language. Shared keys live in <lang>.json; each migrated feature owns its own
// file locales/<lang>/<feature>.json, available as t('<feature>.<key>').
// Some namespaces (catalog, learn, quiz, people, insights, messaging, community, schedule, teacher) are still
// empty on purpose: they are created ahead for the features Phase 8 migrates next, so parallel migrations
// only fill their own files and never edit this one. Keep them until their feature lands.
import enBase from './locales/en.json';
import en_public from './locales/en/public.json';
import en_browse from './locales/en/browse.json';
import en_catalog from './locales/en/catalog.json';
import en_learn from './locales/en/learn.json';
import en_quiz from './locales/en/quiz.json';
import en_people from './locales/en/people.json';
import en_insights from './locales/en/insights.json';
import en_messaging from './locales/en/messaging.json';
import en_community from './locales/en/community.json';
import en_schedule from './locales/en/schedule.json';
import en_showcase from './locales/en/showcase.json';
import en_profile from './locales/en/profile.json';
import en_student from './locales/en/student.json';
import en_teacher from './locales/en/teacher.json';
import bnBase from './locales/bn.json';
import bn_public from './locales/bn/public.json';
import bn_browse from './locales/bn/browse.json';
import bn_catalog from './locales/bn/catalog.json';
import bn_learn from './locales/bn/learn.json';
import bn_quiz from './locales/bn/quiz.json';
import bn_people from './locales/bn/people.json';
import bn_insights from './locales/bn/insights.json';
import bn_messaging from './locales/bn/messaging.json';
import bn_community from './locales/bn/community.json';
import bn_schedule from './locales/bn/schedule.json';
import bn_showcase from './locales/bn/showcase.json';
import bn_profile from './locales/bn/profile.json';
import bn_student from './locales/bn/student.json';
import bn_teacher from './locales/bn/teacher.json';

export const en = {
  ...enBase,
  public: en_public,
  browse: en_browse,
  catalog: en_catalog,
  learn: en_learn,
  quiz: en_quiz,
  people: en_people,
  insights: en_insights,
  messaging: en_messaging,
  community: en_community,
  schedule: en_schedule,
  showcase: en_showcase,
  profile: en_profile,
  student: en_student,
  teacher: en_teacher,
};

export const bn = {
  ...bnBase,
  public: bn_public,
  browse: bn_browse,
  catalog: bn_catalog,
  learn: bn_learn,
  quiz: bn_quiz,
  people: bn_people,
  insights: bn_insights,
  messaging: bn_messaging,
  community: bn_community,
  schedule: bn_schedule,
  showcase: bn_showcase,
  profile: bn_profile,
  student: bn_student,
  teacher: bn_teacher,
};
