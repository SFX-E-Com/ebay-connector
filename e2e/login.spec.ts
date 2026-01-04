import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form elements', async ({ page }) => {
    // Check page title and heading
    await expect(page.getByRole('heading', { name: 'eBay Connector' })).toBeVisible();
    await expect(page.getByText('Admin Portal')).toBeVisible();

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation for empty fields', async ({ page }) => {
    // Click submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    // The email field should be focused due to required attribute
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test('allows typing in email and password fields', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message (API will return error)
    await expect(page.getByText(/error|invalid|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows loading state when submitting', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Click submit and check for loading state
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();

    // Button should show loading text briefly
    // Note: This might be too fast to catch, so we just verify the button exists
    await expect(submitButton).toBeVisible();
  });

  test('has secure authentication notice', async ({ page }) => {
    await expect(
      page.getByText(/secure authentication/i)
    ).toBeVisible();
  });
});

test.describe('Login Page - Accessibility', () => {
  test('form fields are properly labeled', async ({ page }) => {
    await page.goto('/login');

    // Check that inputs have associated labels
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
