import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, TOKEN_STORAGE_KEY } from '@/src/lib/api';
import { ApiError } from '@/src/lib/errors';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { GuestOnly, RequireAuth } from '@/src/App';
import { LoginPage } from '@/src/pages/LoginPage';
import type { User } from '@/src/types/api';

vi.mock('@/src/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/lib/api')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      auth: {
        ...actual.api.auth,
        login: vi.fn(),
        me: vi.fn(),
      },
    },
  };
});

const adminUser: User = {
  id: 'u-admin',
  name: 'Admin User',
  email: 'admin@bpf.com',
  role: 'admin',
};

const memberUser: User = {
  id: 'u-member',
  name: 'Member User',
  email: 'member@bpf.com',
  role: 'member',
};

function DashboardStub() {
  const { user } = useAuth();
  return (
    <div>
      Dashboard — {user.name} ({user.role})
    </div>
  );
}

function renderApp(
  initialEntries: Array<string | { pathname: string; state?: unknown }>
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestOnly>
                    <LoginPage />
                  </GuestOnly>
                }
              />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <DashboardStub />
                  </RequireAuth>
                }
              />
              <Route
                path="/snacks"
                element={
                  <RequireAuth>
                    <div>Snacks page</div>
                  </RequireAuth>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

async function fillAndSubmit(
  email = 'member@bpf.com',
  password = 'Member@123'
) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('LoginPage', () => {
  it('renders labels, inputs and the submit button', () => {
    renderApp(['/login']);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(
      screen.getByRole('button', { name: 'Show password' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    renderApp(['/login']);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(api.auth.login).not.toHaveBeenCalled();
  });

  it('shows a validation error for an invalid email on blur and submit', async () => {
    const user = userEvent.setup();
    renderApp(['/login']);

    const email = screen.getByLabelText('Email');
    await user.type(email, 'not-an-email');
    await user.tab();
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(api.auth.login).not.toHaveBeenCalled();
  });

  it('logs in, stores the session and redirects to the dashboard', async () => {
    vi.mocked(api.auth.login).mockResolvedValue({
      token: 'test-token',
      user: adminUser,
    });
    renderApp(['/login']);

    await fillAndSubmit('admin@bpf.com', 'Admin@123');

    expect(api.auth.login).toHaveBeenCalledWith('admin@bpf.com', 'Admin@123');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('test-token');
    expect(
      await screen.findByText('Dashboard — Admin User (admin)')
    ).toBeInTheDocument();
  });

  it('redirects back to the originally requested route after login', async () => {
    vi.mocked(api.auth.login).mockResolvedValue({
      token: 'test-token',
      user: memberUser,
    });
    renderApp(['/snacks']);

    // RequireAuth bounced us to /login; the form should be visible.
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    await fillAndSubmit();

    expect(await screen.findByText('Snacks page')).toBeInTheDocument();
  });

  it('shows the generic message for 401 UNAUTHENTICATED', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password')
    );
    renderApp(['/login']);

    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Incorrect email or password.');
    expect(alert).toHaveFocus();
  });

  it('shows the rate-limit message for 429 RATE_LIMITED', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new ApiError(429, 'RATE_LIMITED', 'Too many attempts')
    );
    renderApp(['/login']);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Please wait a minute and try again.'
    );
  });

  it('shows the generic message for network failures', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to the server.')
    );
    renderApp(['/login']);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.'
    );
    // Entered email is preserved.
    expect(screen.getByLabelText('Email')).toHaveValue('member@bpf.com');
  });

  it('disables the form and sends a single request while submitting', async () => {
    let resolveLogin: (value: { token: string; user: User }) => void = () => {};
    vi.mocked(api.auth.login).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    renderApp(['/login']);

    await fillAndSubmit();

    const submit = screen.getByRole('button', { name: /signing in/i });
    expect(submit).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();

    // A second click while in flight must not send another request.
    fireEvent.click(submit);
    fireEvent.submit(submit.closest('form') as HTMLFormElement);
    expect(api.auth.login).toHaveBeenCalledTimes(1);

    resolveLogin({ token: 'test-token', user: memberUser });
    expect(
      await screen.findByText('Dashboard — Member User (member)')
    ).toBeInTheDocument();
  });

  it('toggles the password field type', async () => {
    const user = userEvent.setup();
    renderApp(['/login']);

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('redirects authenticated users away from /login', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token');
    vi.mocked(api.auth.me).mockResolvedValue(memberUser);
    renderApp(['/login']);

    expect(
      await screen.findByText('Dashboard — Member User (member)')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('hides demo buttons when VITE_SHOW_DEMO_LOGIN is not set', () => {
    renderApp(['/login']);

    expect(
      screen.queryByRole('button', { name: 'Demo: Admin' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Demo: Member' })
    ).not.toBeInTheDocument();
  });

  it('shows demo buttons that submit through the normal login flow', async () => {
    vi.stubEnv('VITE_SHOW_DEMO_LOGIN', 'true');
    vi.mocked(api.auth.login).mockResolvedValue({
      token: 'demo-token',
      user: adminUser,
    });
    const user = userEvent.setup();
    renderApp(['/login']);

    await user.click(screen.getByRole('button', { name: 'Demo: Admin' }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith(
        'admin@bpf.com',
        'Admin@123'
      );
    });
    expect(
      await screen.findByText('Dashboard — Admin User (admin)')
    ).toBeInTheDocument();
  });
});
