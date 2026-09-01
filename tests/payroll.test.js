const test = require("node:test");
const assert = require("node:assert/strict");

const {
	calculatePayTotals,
	calculatePayrollResults,
	checkIfRestDay,
	formatMoney,
} = require("../js/payrollcalculation.js");

function blankDays(count) {
	return Array.from({ length: count }, () => ({ start: 0, end: 0 }));
}

test("ordinary 08:00–19:00 shift counts as one day and two OT hours", () => {
	const results = calculatePayrollResults(
		"2026-09",
		[{ start: 8, end: 19 }],
		new Set(),
	);

	assert.deepEqual(results, {
		workingDays: 1,
		restDaysWorked: 0,
		otHours: 2,
		totalDaysWorked: 1,
		daysUntil10pm: 0,
	});
});

test("a shift of four hours or less counts as half a working day", () => {
	const results = calculatePayrollResults(
		"2026-09",
		[{ start: 8, end: 12 }],
		new Set(),
	);

	assert.equal(results.workingDays, 0.5);
	assert.equal(results.otHours, 0);
	assert.equal(results.totalDaysWorked, 1);
});

test("Sunday work counts as rest-day work", () => {
	const dailyData = blankDays(6);
	dailyData[5] = { start: 8, end: 12 }; // Sunday, 6 September 2026

	const results = calculatePayrollResults("2026-09", dailyData, new Set());
	assert.equal(results.workingDays, 0);
	assert.equal(results.restDaysWorked, 0.5);
	assert.equal(results.totalDaysWorked, 1);
});

test("official public holiday work counts as rest-day work", () => {
	const dailyData = blankDays(25);
	dailyData[24] = { start: 8, end: 19 }; // Christmas Day
	const holidays = new Set(["2026-12-25"]);

	const results = calculatePayrollResults("2026-12", dailyData, holidays);
	assert.equal(results.workingDays, 0);
	assert.equal(results.restDaysWorked, 1);
	assert.equal(results.otHours, 0);
	assert.equal(results.totalDaysWorked, 1);
});

test("an exact 22:00 finish adds one food-allowance day", () => {
	const results = calculatePayrollResults(
		"2026-09",
		[{ start: 8, end: 22 }],
		new Set(),
	);

	assert.equal(results.workingDays, 1);
	assert.equal(results.otHours, 5);
	assert.equal(results.daysUntil10pm, 1);
});

test("an empty day contributes no pay or allowance units", () => {
	const results = calculatePayrollResults(
		"2026-09",
		[{ start: 0, end: 0 }],
		new Set(),
	);

	assert.deepEqual(results, {
		workingDays: 0,
		restDaysWorked: 0,
		otHours: 0,
		totalDaysWorked: 0,
		daysUntil10pm: 0,
	});
});

test("pay components and final total follow the documented rates", () => {
	const totals = calculatePayTotals(
		{
			workingDays: 2,
			restDaysWorked: 1,
			otHours: 3,
			totalDaysWorked: 3,
			daysUntil10pm: 1,
		},
		100,
		10,
	);

	assert.deepEqual(totals, {
		workingPay: 200,
		restDayPay: 150,
		otPayTotal: 30,
		transportPay: 15,
		foodCost: 5,
		totalPay: 400,
	});
	assert.equal(formatMoney(totals.totalPay), "$400.00");
});

test("rest-day detection recognises Sundays and supplied holiday dates", () => {
	assert.equal(checkIfRestDay(new Date(2026, 8, 6), new Set()), true);
	assert.equal(
		checkIfRestDay(new Date(2026, 7, 10), new Set(["2026-08-10"])),
		true,
	);
	assert.equal(checkIfRestDay(new Date(2026, 8, 1), new Set()), false);
});
