const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { normalizeHolidayRecords } = require("../js/payrollinput.js");

const holidayFile = path.join(
	__dirname,
	"..",
	"data",
	"sg-public-holidays.json",
);
const holidayData = JSON.parse(fs.readFileSync(holidayFile, "utf8"));

test("bundled holiday snapshot identifies its official source and coverage", () => {
	assert.equal(
		holidayData.source,
		"Singapore Ministry of Manpower via data.gov.sg",
	);
	assert.deepEqual(holidayData.supportedYears, [
		2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027,
	]);
	assert.equal(holidayData.holidays.length, 104);
});

test("bundled holiday dates are unique, valid ISO dates with names", () => {
	const dates = holidayData.holidays.map((record) => record.date);
	assert.equal(new Set(dates).size, dates.length);

	holidayData.holidays.forEach((record) => {
		assert.match(record.date, /^\d{4}-\d{2}-\d{2}$/);
		assert.ok(record.holiday.trim().length > 0);
	});
});

test("each supported year contains at least the 11 gazetted holiday dates", () => {
	holidayData.supportedYears.forEach((year) => {
		const recordsForYear = normalizeHolidayRecords(holidayData.holidays, year);
		assert.ok(recordsForYear.size >= 11, `${year} has too few holiday dates`);
	});
});

test("2026 includes official holidays and observed Monday holidays", () => {
	const holidays2026 = normalizeHolidayRecords(holidayData.holidays, 2026);

	assert.equal(holidays2026.size, 14);
	assert.equal(holidays2026.get("2026-01-01"), "New Year’s Day");
	assert.equal(
		holidays2026.get("2026-06-01"),
		"Vesak Day (Observed)",
	);
	assert.equal(
		holidays2026.get("2026-08-10"),
		"National Day (Observed)",
	);
	assert.equal(
		holidays2026.get("2026-11-09"),
		"Deepavali (Observed)",
	);
});

test("unsupported years do not silently inherit another year's dates", () => {
	assert.equal(normalizeHolidayRecords(holidayData.holidays, 2028).size, 0);
});
