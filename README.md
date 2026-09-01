# Fa Da Pte Ltd website and tools dashboard

This repository contains the Fa Da Pte Ltd company website and a browser-based
dashboard for payroll calculations and future internal tools.

Live website: <https://fadapteltd.github.io/>

## Website pages

- `index.html` presents the company profile, services and contact links.
- `login.html` is the entry point for the boss/developer dashboard.
- `dashboard/hub.html` lists the available internal tools.
- `dashboard/dashboard.html` contains the monthly payroll calculator.

The intended navigation is:

```text
Home → Login → Dashboard Menu → Payroll Calculator
```

## Dashboard access

A successful login creates a browser session that lasts for two hours. The
session also ends when its browser tab/window session closes. Opening a
dashboard page without an active session redirects to the login page, and the
Log out button ends the session immediately.

The website is hosted on public GitHub Pages, so the access check runs in the
browser rather than on a private server. Do not put confidential records,
private API keys or other secrets in the repository. A future tool that stores
sensitive data should use authenticated server-side storage.

## Using the payroll calculator

1. Select a month and year.
2. Wait for the public-holiday status to confirm that verified dates are
   available.
3. Enter the employee name, daily basic-pay rate and hourly overtime rate.
4. Review or edit the generated start and end times for each day.
5. Select **Calculate Payslip**.

Sundays and public holidays are shown in red and default to zero hours. Ordinary
days default to a start time of 08:00 and an end time of 19:00.

### Calculation rules

- **Basic Pay** is a daily rate.
- **OT Pay** is an hourly rate.
- A shift of 4 hours or less counts as half a day.
- A shift longer than 4 hours counts as one day.
- Sundays and official public holidays are treated as rest days.
- Rest-day/public-holiday work pays `daily rate × 1.5`.
- On an ordinary working day, time beyond 9 elapsed hours is overtime.
- Transport allowance is S$5 for each day containing recorded work.
- Food allowance is S$5 when the recorded end time is exactly 22:00.
- A start time of `0` and end time of `0` means no work for that day.

The calculator does not handle CPF, tax, leave, deductions, monthly-salary
conversion or overnight shifts.

## Public-holiday data

Public-holiday dates come from the Singapore Ministry of Manpower's
**Singapore Public Holidays (consolidated)** dataset on data.gov.sg:

<https://data.gov.sg/datasets/d_8ef23381f9417e4d4254ee8b4dcdb176/view>

The calculator reads the bundled official snapshot in
`data/sg-public-holidays.json`. If the selected year is not available in that
file, it checks the live data.gov.sg dataset. Calculation remains disabled when
neither source contains verified dates for the selected year.

The JSON file records its retrieval date and supported years. It includes
observed public holidays as separate dates where applicable.

### Updating the holiday snapshot

Node.js 18 or later is required for the update command:

```powershell
node scripts/update-holidays.mjs
node --test
```

Run the updater after MOM/data.gov.sg publishes another year's holiday dates.
Review the JSON changes and confirm that all tests pass before publishing.

## Running locally

The website has no build step and no package installation is required. Serve
the repository over HTTP so it behaves like the GitHub Pages deployment.

Using Python:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>. VS Code Live Server or another static-file
server can be used instead.

## Tests

Node.js 18 or later is required. Run the complete test suite with:

```powershell
node --test
```

The tests cover:

- login-session creation, expiry, storage and logout;
- dashboard route guards and mobile viewport declarations;
- ordinary, half-day, overtime, Sunday and public-holiday calculations;
- transport and food allowances;
- holiday-file structure, coverage, observed dates and unsupported years; and
- safe payslip rendering requirements.

## Project structure

```text
index.html                         Public company page
login.html                         Dashboard login
dashboard/hub.html                 Internal tools menu
dashboard/dashboard.html           Payroll input page
css/main-styles.css                Public-page styles
css/dashboard-styles.css           Login and dashboard styles
js/script.js                       Phone, clipboard and map behaviour
js/auth.js                         Login session, route guard and logout
js/payrollinput.js                 Holiday loading and timesheet input
js/payrollcalculation.js           Pay calculation and payslip rendering
data/sg-public-holidays.json       Bundled official holiday data
scripts/update-holidays.mjs        Holiday data updater
tests/                             Automated tests
```

## Deployment checklist

GitHub Pages serves the repository from the `main` branch.

Before publishing:

1. Run `node --test`.
2. Check the home page, login, dashboard menu and calculator on desktop and
   mobile widths.
3. Confirm that opening a dashboard URL without a session redirects to login.
4. Confirm that the intended calculation year loads verified holiday data.
5. Confirm that this README still matches the project's navigation, rules,
   data sources and commands.
