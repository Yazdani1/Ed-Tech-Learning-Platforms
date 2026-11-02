import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CourseEditorPage } from '../CourseEditorPage';

import { COURSE_ID, catalogHandlers, makeCourse } from './fixtures';

import type { Course } from '@/schemas/browse.schema';

const CLOUD = 'https://res.cloudinary.com/test-cloud/image/upload';
const NODE = { _id: '64b7f0c2a1b2c3d4e5f6a101', name: 'Node.js', logoUrl: `${CLOUD}/node.png` };
const REACT = { _id: '64b7f0c2a1b2c3d4e5f6a102', name: 'React', logoUrl: `${CLOUD}/react.png` };
const png = (name: string): File => new File(['png'], name, { type: 'image/png' });

const renderTab = async (tab: string, course: Course = makeCourse()) => {
  server.use(
    signedInAs(makeUser('Admin')),
    ...catalogHandlers,
    http.get(`*/api/courses/${COURSE_ID}`, () => ok(course)),
    http.get('*/api/tools', () => ok([NODE, REACT])),
  );
  renderWithProviders(
    <ConfirmProvider>
      <CourseEditorPage courseId={COURSE_ID} />
    </ConfirmProvider>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('tab', { name: tab }));
  return user;
};

/** Records the body of PATCH /api/courses/:id/extras and answers with the merged sections. */
const extrasRecorder = () => {
  const bodies: Record<string, unknown>[] = [];
  const handler = http.patch(`*/api/courses/${COURSE_ID}/extras`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    bodies.push(body);
    return ok({ ...body, toolsSection: undefined });
  });
  return { bodies, handler };
};

describe('Course editor: new section tabs', () => {
  it('lists the six new tabs after Learning Content', async () => {
    await renderTab('Tools');
    const names = screen.getAllByRole('tab').map((tab) => tab.textContent);
    for (const name of [
      'Tools',
      'What You Get',
      'Projects',
      'Who This Course Is For',
      'Success Stories',
      'FAQ',
    ]) {
      expect(names).toContain(name);
    }
  });

  it('Tools: chooses tools in the right-side picker and saves ids with the title and description', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(handler);
    const user = await renderTab('Tools');

    expect(await screen.findByText('No tools chosen yet.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Section title'), 'Our stack');
    await user.type(screen.getByLabelText('Section description'), 'What we teach');
    await user.click(screen.getByRole('button', { name: 'Choose tools' }));
    const drawer = await screen.findByRole('dialog', { name: 'Choose tools' });
    const node = await within(drawer).findByRole('checkbox', { name: /Node\.js/ });
    const react = within(drawer).getByRole('checkbox', { name: /React/ });
    await user.click(node);
    await user.click(react);
    await user.click(react);
    expect(node).toHaveAttribute('aria-checked', 'true');
    expect(react).toHaveAttribute('aria-checked', 'false');
    await user.click(within(drawer).getByRole('button', { name: 'Use 1 tool' }));

    expect(await screen.findByText('1 tool selected')).toBeInTheDocument();
    // The drawer is still sliding out (page hidden from the accessibility tree) for a moment
    await user.click(await screen.findByRole('button', { name: 'Save section' }));

    expect(await screen.findByText('Section saved')).toBeInTheDocument();
    expect(bodies).toEqual([
      { toolsSection: { title: 'Our stack', description: 'What we teach', tools: [NODE._id] } },
    ]);
  });

  it('Tools: starts with the saved tools preselected, and a tool can be removed', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(handler);
    const user = await renderTab(
      'Tools',
      makeCourse({ toolsSection: { title: '', description: '', tools: [NODE, REACT] } }),
    );

    expect(await screen.findByText('2 tools selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Node.js' }));
    await user.click(screen.getByRole('button', { name: 'Save section' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({ toolsSection: { title: '', description: '', tools: [REACT._id] } });
  });

  it('Tools: shows the backend message when saving fails', async () => {
    server.use(http.patch(`*/api/courses/${COURSE_ID}/extras`, () => fail(400, 'Unknown tool')));
    const user = await renderTab('Tools');

    await user.click(await screen.findByRole('button', { name: 'Save section' }));

    expect(await screen.findByText('Unknown tool')).toBeInTheDocument();
  });

  it('What You Get: uploads a logo, adds items, needs a title for each, and saves', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(
      handler,
      http.post(`*/api/courses/${COURSE_ID}/images`, () =>
        ok({ url: `${CLOUD}/perk.png`, publicId: 'perk' }),
      ),
    );
    const user = await renderTab('What You Get');

    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    // An item without a title is refused without asking the server
    await user.click(screen.getByRole('button', { name: 'Save section' }));
    expect(await screen.findByText('Every item needs a title.')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await user.type(screen.getByLabelText(/Title of item 1/), 'Lifetime access');
    await user.type(screen.getByLabelText('Description'), 'Watch any time');
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('logo input missing');
    await user.upload(input, png('perk.png'));
    await screen.findByText('Choose logo');
    await user.click(screen.getByRole('button', { name: 'Save section' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({
      benefitsSection: {
        title: '',
        description: '',
        items: [
          {
            title: 'Lifetime access',
            description: 'Watch any time',
            icon: { url: `${CLOUD}/perk.png`, publicId: 'perk' },
          },
        ],
      },
    });
  });

  it('Who This Course Is For: adds items with Enter and saves the list', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(handler);
    const user = await renderTab('Who This Course Is For');

    const group = await screen.findByRole('group', { name: 'Who this course is for' });
    const input = within(group).getByLabelText('New item for Who this course is for');
    await user.type(input, 'Beginners{Enter}');
    await user.type(input, 'Career changers{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save section' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({ audience: ['Beginners', 'Career changers'] });
  });

  it('FAQ: adds a question in a dialog and saves the whole list', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(handler);
    const user = await renderTab(
      'FAQ',
      makeCourse({ faqs: [{ question: 'Old?', answer: 'Yes' }] }),
    );

    expect(await screen.findByText('Old?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add question' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add question' });
    // Both fields are required
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findAllByText('This field is required')).toHaveLength(2);
    expect(bodies).toHaveLength(0);

    await user.type(within(dialog).getByLabelText(/Question/), 'Is there a certificate?');
    await user.type(within(dialog).getByLabelText(/Answer/), 'Yes, at the end.');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({
      faqs: [
        { question: 'Old?', answer: 'Yes' },
        { question: 'Is there a certificate?', answer: 'Yes, at the end.' },
      ],
    });
  });

  it('FAQ: edits and deletes (after confirming) a question', async () => {
    const { bodies, handler } = extrasRecorder();
    server.use(handler);
    const user = await renderTab(
      'FAQ',
      makeCourse({
        faqs: [
          { question: 'First?', answer: 'One' },
          { question: 'Second?', answer: 'Two' },
        ],
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Actions for First?' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit question' });
    const answer = within(dialog).getByLabelText(/Answer/);
    expect(answer).toHaveValue('One');
    await user.clear(answer);
    await user.type(answer, 'Uno');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({
      faqs: [
        { question: 'First?', answer: 'Uno' },
        { question: 'Second?', answer: 'Two' },
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Actions for Second?' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    await screen.findAllByText('Section saved');
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual({ faqs: [{ question: 'First?', answer: 'Uno' }] });
  });

  it('Success Stories: adds a story with a photo and company logo from the dialog', async () => {
    const { bodies, handler } = extrasRecorder();
    let uploads = 0;
    server.use(
      handler,
      http.post(`*/api/courses/${COURSE_ID}/images`, () => {
        uploads += 1;
        return ok({ url: `${CLOUD}/img${uploads}.png`, publicId: `img${uploads}` });
      }),
    );
    const user = await renderTab('Success Stories');

    await user.click(await screen.findByRole('button', { name: 'Add success story' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add success story' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('This field is required')).toBeInTheDocument();

    const inputs = dialog.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs).toHaveLength(2);
    const [photoInput, logoInput] = Array.from(inputs);
    if (!photoInput || !logoInput) throw new Error('file inputs missing');
    await user.upload(photoInput, png('me.png'));
    await user.upload(logoInput, png('acme.png'));
    await user.type(within(dialog).getByLabelText(/Title/), 'Rahim, Engineer');
    await user.type(within(dialog).getByLabelText('Description'), 'Got a job');
    await user.type(within(dialog).getByLabelText('Company name'), 'Acme');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({
      successStories: [
        {
          title: 'Rahim, Engineer',
          description: 'Got a job',
          companyName: 'Acme',
          photo: { url: `${CLOUD}/img1.png`, publicId: 'img1' },
          companyLogo: { url: `${CLOUD}/img2.png`, publicId: 'img2' },
        },
      ],
    });
  });

  it('Projects: adds a project with screenshots in the right-side drawer; a bad link is refused', async () => {
    const { bodies, handler } = extrasRecorder();
    let uploads = 0;
    server.use(
      handler,
      http.post(`*/api/courses/${COURSE_ID}/images`, () => {
        uploads += 1;
        return ok({ url: `${CLOUD}/shot${uploads}.png`, publicId: `shot${uploads}` });
      }),
    );
    const user = await renderTab('Projects');

    expect(await screen.findByText('No projects yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add project' }));
    const drawer = await screen.findByRole('dialog', { name: 'Add project' });
    await user.type(within(drawer).getByLabelText(/Project title/), 'Todo app');
    await user.type(within(drawer).getByLabelText('Description'), 'Build it');
    const input = drawer.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('screenshot input missing');
    await user.upload(input, [png('a.png'), png('b.png')]);
    expect(await within(drawer).findByText('Screenshots (2/10)')).toBeInTheDocument();
    await user.type(within(drawer).getByLabelText(/Live demo link/), 'not a link');
    await user.click(within(drawer).getByRole('button', { name: 'Save' }));
    expect(
      await within(drawer).findByText('Enter a link that starts with http:// or https://'),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    const demo = within(drawer).getByLabelText(/Live demo link/);
    await user.clear(demo);
    await user.type(demo, 'https://demo.example.com');
    await user.type(
      within(drawer).getByLabelText(/Intro video link/),
      'https://www.youtube.com/watch?v=abc',
    );
    await user.click(within(drawer).getByRole('button', { name: 'Save' }));

    await screen.findByText('Section saved');
    expect(bodies[0]).toEqual({
      projects: [
        {
          title: 'Todo app',
          description: 'Build it',
          images: [
            { url: `${CLOUD}/shot1.png`, publicId: 'shot1' },
            { url: `${CLOUD}/shot2.png`, publicId: 'shot2' },
          ],
          liveDemoUrl: 'https://demo.example.com',
          videoUrl: 'https://www.youtube.com/watch?v=abc',
        },
      ],
    });
  });

  it('shows "Save the course first" on the new tabs of an unsaved course', async () => {
    server.use(signedInAs(makeUser('Admin')), ...catalogHandlers);
    renderWithProviders(
      <ConfirmProvider>
        <CourseEditorPage />
      </ConfirmProvider>,
    );
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Tools' }));

    expect(
      await screen.findByText('Save the course first (Save Draft) to use this section.'),
    ).toBeInTheDocument();
  });
});
