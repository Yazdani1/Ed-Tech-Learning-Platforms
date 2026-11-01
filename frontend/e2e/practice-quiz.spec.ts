import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { ACCOUNTS, E2E_PASSWORD, expectNoHorizontalScroll, isPhone, uniqueEmail } from './helpers';

type ApiResponse = Awaited<ReturnType<APIRequestContext['post']>>;

const dataId = async (response: ApiResponse): Promise<string> => {
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { data: { _id: string } };
  return body.data._id;
};

interface SeededQuiz {
  courseId: string;
  title: string;
  bankId: string;
  bank: string;
}

const addQuestion = async (request: APIRequestContext, bankId: string): Promise<void> => {
  const question = await request.post(`/api/quiz-bank/${bankId}/questions`, {
    data: {
      question: 'Unit of force?',
      options: [
        { text: 'Newton', explanation: 'The SI unit of force' },
        { text: 'Joule' },
        { text: 'Watt' },
        { text: 'Pascal' },
      ],
      correctOptionIndices: [0],
    },
  });
  expect(question.ok(), await question.text()).toBe(true);
};

/**
 * As the E2E admin: a published public course with a free-preview quiz section (one bank, one question; the
 * first option is correct) and a locked section with one bank.
 */
const seedQuiz = async (request: APIRequestContext, testInfo: TestInfo): Promise<SeededQuiz> => {
  const stamp = `${testInfo.project.name} ${Date.now()}`;
  const title = `E2E Practice ${stamp}`;
  const login = await request.post('/api/auth/login', {
    data: { email: ACCOUNTS.admin.email, password: E2E_PASSWORD },
  });
  expect(login.ok()).toBe(true);
  const category = await dataId(
    await request.post('/api/categories', { data: { name: `${title} cat` } }),
  );
  const courseType = await dataId(
    await request.post('/api/course-types', { data: { name: `${title} type` } }),
  );
  const courseId = await dataId(
    await request.post('/api/courses', {
      data: { title, category, courseType, pricing: 'Free', visibility: 'Public' },
    }),
  );
  const sectionId = await dataId(
    await request.post(`/api/courses/${courseId}/sections`, { data: { title: 'Getting started' } }),
  );
  await dataId(
    await request.post(`/api/courses/${courseId}/sections/${sectionId}/lectures`, {
      data: { title: 'Welcome lecture', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', duration: 90 },
    }),
  );
  const publish = await request.patch(`/api/courses/${courseId}/status`, {
    data: { status: 'Published' },
  });
  expect(publish.ok()).toBe(true);

  const freeSection = await dataId(
    await request.post('/api/quiz-sections', {
      data: { course: courseId, title: 'Free chapter', isFreePreview: true },
    }),
  );
  const bank = `Forces ${stamp}`;
  const bankId = await dataId(
    await request.post('/api/quiz-bank', {
      data: { course: courseId, quizSection: freeSection, title: bank },
    }),
  );
  await addQuestion(request, bankId);
  const lockedSection = await dataId(
    await request.post('/api/quiz-sections', { data: { course: courseId, title: 'Paid chapter' } }),
  );
  await addQuestion(
    request,
    await dataId(
      await request.post('/api/quiz-bank', {
        data: { course: courseId, quizSection: lockedSection, title: `Locked ${stamp}` },
      }),
    ),
  );
  return { courseId, title, bankId, bank };
};

const openBank = async (page: Page, quiz: SeededQuiz): Promise<void> => {
  await page.goto(`/practice-quiz?courseId=${quiz.courseId}&bankId=${quiz.bankId}`);
  await expect(page.getByRole('heading', { name: quiz.bank, exact: true, level: 2 })).toBeVisible();
};

const answer = async (page: Page, option: string): Promise<void> => {
  const card = page.getByRole('article', { name: 'Q 1 of 1' });
  await card.getByRole('checkbox', { name: new RegExp(option) }).click();
  await card.getByRole('button', { name: 'Check Answer' }).click();
};

test.describe('Practice quiz', () => {
  test('a guest opens a deep link, checks an answer and sees the course list', async ({
    page,
    request,
  }, testInfo) => {
    const quiz = await seedQuiz(request, testInfo);
    await openBank(page, quiz);
    await expect(page.getByText('1 locked')).toBeVisible();
    await expect(page.getByText(/Sign in to save your progress/)).toBeVisible();

    const card = page.getByRole('article', { name: 'Q 1 of 1' });
    await expect(card.getByText('The SI unit of force')).toHaveCount(0);
    await answer(page, 'Newton');
    await expect(card.getByText('✓ Correct!')).toBeVisible();
    await expect(card.getByText('The SI unit of force')).toBeVisible();

    if (isPhone(page)) await page.getByRole('button', { name: 'Courses', exact: true }).click();
    const list = page.getByRole('region', { name: 'Courses with free quizzes' });
    await expect(list.getByText(quiz.title, { exact: true })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('a signed-in student saves an answer, keeps it after a reload and resets the bank', async ({
    page,
    request,
  }, testInfo) => {
    const quiz = await seedQuiz(request, testInfo);
    const register = await page.request.post('/api/auth/register', {
      data: { name: 'E2E Practice Student', email: uniqueEmail(testInfo), password: E2E_PASSWORD },
    });
    expect(register.ok()).toBe(true);

    await openBank(page, quiz);
    await expect(page.getByText(/Sign in to save your progress/)).toHaveCount(0);
    await answer(page, 'Joule');
    const card = page.getByRole('article', { name: 'Q 1 of 1' });
    await expect(card.getByText(/Incorrect/)).toBeVisible();
    await expect(card.getByText('The SI unit of force')).toBeVisible();

    await page.reload();
    await expect(card.getByText(/Incorrect/)).toBeVisible();
    await page
      .getByRole('button', { name: `Reset progress for ${quiz.bank}` })
      .first()
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByText('Practice reset')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Check Answer' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
