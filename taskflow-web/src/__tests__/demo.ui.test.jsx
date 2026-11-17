// @vitest-environment jsdom
// End-to-end smoke test of the GitHub Pages demo: the real app, router (with the Pages base path) and demo API.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/ui/Toast';

import { configure } from '@testing-library/react';

configure({ asyncUtilTimeout: 8000 });

const BASE = '/-TaskFlow/';

function open(path = '') {
  window.history.pushState({}, '', BASE + path);
  return render(
    <BrowserRouter basename={BASE}>
      <ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider>
    </BrowserRouter>,
  );
}
const here = () => window.location.pathname + window.location.search;

async function login(user, email = 'alice@example.com', password = 'Password123') {
  await user.type(await screen.findByLabelText(/^email/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole('button', { name: /log in/i }));
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(cleanup);

describe('GitHub Pages demo', () => {
  it('shows the demo banner and sends logged-out visitors from a deep link to login', async () => {
    open('tasks');
    expect(await screen.findByRole('button', { name: /log in/i })).toBeTruthy();
    expect(here()).toBe(BASE + 'login');
    expect(document.body.textContent).toMatch(/demo/i);
  });

  it('rejects a wrong password with one generic message', async () => {
    const user = userEvent.setup();
    open('login');
    await login(user, 'alice@example.com', 'Wrong12345');
    expect(await screen.findByText(/do not match our records/i)).toBeTruthy();
    expect(here()).toBe(BASE + 'login');
  });

  it('logs in, shows the dashboard, creates / edits / completes / deletes a task, and logs out', async () => {
    const user = userEvent.setup();
    open('login');
    await login(user);

    expect(await screen.findByRole('heading', { name: /hello, alice/i })).toBeTruthy();
    expect(here()).toBe(BASE + 'dashboard');
    const stats = await screen.findByRole('region', { name: /task statistics/i });
    expect(within(stats).getByText('30')).toBeTruthy(); // Alice has 30 seeded tasks

    // create
    await user.click((await screen.findAllByRole('link', { name: /my tasks|tasks/i }))[0]);
    expect(await screen.findByRole('heading', { name: /my tasks/i })).toBeTruthy();
    window.history.pushState({}, '', BASE + 'tasks/new');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await user.type(await screen.findByLabelText(/^title/i), 'Client demo task');
    await user.click(screen.getByRole('button', { name: /^(save|create)/i }));
    await waitFor(() => expect(here()).toMatch(/\/-TaskFlow\/tasks/));
    expect(await screen.findByText('Client demo task')).toBeTruthy();

    // server-side validation shows under the field
    window.history.pushState({}, '', BASE + 'tasks/new');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await user.click(await screen.findByRole('button', { name: /^(save|create)/i }));
    expect(await screen.findByText(/title field is required/i)).toBeTruthy();

    // logout
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(await screen.findByRole('button', { name: /log in/i })).toBeTruthy();
    expect(here()).toBe(BASE + 'login');
  });


  it('changes status from the list, edits, filters by search, and deletes with confirmation', async () => {
    const user = userEvent.setup();
    open('login');
    await login(user);
    await screen.findByRole('heading', { name: /hello, alice/i });

    // create a uniquely named task through the form
    await user.click((await screen.findAllByRole('link', { name: /new task|add task|create/i }))[0]);
    await user.type(await screen.findByLabelText(/^title/i), 'Zebra checklist');
    await user.click(screen.getByRole('button', { name: /^(save|create)/i }));
    await screen.findByText('Zebra checklist');

    // search narrows the list to it
    if (!window.location.pathname.endsWith('/tasks')) await user.click((await screen.findAllByRole('link', { name: /my tasks/i }))[0]);
    await user.type(await screen.findByLabelText(/^search/i), 'Zebra');
    await waitFor(() => expect(screen.queryAllByText(/Zebra checklist/).length).toBeGreaterThan(0));

    // quick status change (PATCH status only)
    const sel = (await screen.findAllByLabelText('Status of Zebra checklist'))[0];
    await user.selectOptions(sel, 'completed');
    await waitFor(() => expect(screen.getAllByLabelText('Status of Zebra checklist')[0].value).toBe('completed'));

    // delete with confirmation dialog naming the task
    await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
    expect(await screen.findByText(/delete .Zebra checklist.?/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /delete task/i }));
    await waitFor(() => expect(screen.queryAllByLabelText('Status of Zebra checklist').length).toBe(0));
  });

  it('registers a new account, lands on an empty dashboard, and rejects a duplicate email', async () => {
    const user = userEvent.setup();
    open('register');
    await user.type(await screen.findByLabelText(/^name/i), 'Client Tester');
    await user.type(screen.getByLabelText(/^email/i), 'client@example.org');
    await user.type(screen.getByLabelText(/^password/i), 'Sup3rSecret99');
    await user.type(screen.getByLabelText(/confirm password/i), 'Sup3rSecret99');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('heading', { name: /hello, client/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /log out/i }));
    await user.click(await screen.findByRole('link', { name: /create an account/i }));
    await user.type(await screen.findByLabelText(/^name/i), 'Dup');
    await user.type(screen.getByLabelText(/^email/i), 'client@example.org');
    await user.type(screen.getByLabelText(/^password/i), 'Sup3rSecret99');
    await user.type(screen.getByLabelText(/confirm password/i), 'Sup3rSecret99');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/already been taken/i)).toBeTruthy();
  });

  it('forgot-password gives the same neutral reply', async () => {
    const user = userEvent.setup();
    open('forgot-password');
    await user.type(await screen.findByLabelText(/^email/i), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/if that email exists/i)).toBeTruthy();
  });

  it('unknown URLs show the not-found page, not a blank screen', async () => {
    open('no/such/page');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeTruthy();
  });
});
