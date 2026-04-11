# Contributing

Thanks for your interest in contributing to **Guitar Loop Trainer**! Here's how to get started.

## Getting Started

1. **Fork** the repository and clone your fork.
2. Install dependencies:

```bash
npm install
npx playwright install chromium
```

3. Start the dev server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

1. Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes.
3. Run lint and tests before committing:

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
```

4. Commit with a clear, concise message describing **why** the change was made.
5. Push your branch and open a Pull Request against `main`.

## Code Style

- This project uses **ESLint** and **Prettier** for consistent code quality and formatting.
- Run `npm run lint:fix` to auto-fix linting issues.
- Run `npm run format` to auto-format all files.
- Follow the existing module structure in `js/` — each file has a single responsibility.
- Use named constants from `js/config.js` instead of magic numbers.
- Add JSDoc comments to exported functions.

## Testing

- **Unit tests** live in `tests/` and use [Vitest](https://vitest.dev/).
- **E2E tests** live in `e2e/` and use [Playwright](https://playwright.dev/).
- If you add a new feature, add tests for it.
- See [docs/TESTING.md](docs/TESTING.md) for the full testing guide.

## Project Structure

This is a **vanilla HTML/CSS/JS** project with no build step. The `js/` directory contains ES modules loaded natively by the browser. See the [README](README.md) for the full file tree.

## Reporting Issues

Open an [issue](https://github.com/bonniegrs/Guitar-Loop-Trainer/issues) with:

- A clear title and description
- Steps to reproduce (if it's a bug)
- Expected vs. actual behavior
- Browser and OS info

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
