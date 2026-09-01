/**
 * Calculates payroll stats and renders the payslip.
 * @param {string} month - In format "YYYY-MM".
 * @param {Array<Object>} dailyData - Entries such as { start: 8, end: 19 }.
 * @param {number} basicPay - Daily basic pay rate.
 * @param {number} otPay - Hourly overtime rate.
 * @param {string} employeeName - Employee name.
 * @returns {{results: Object, totals: Object}}
 */
function calculatePayrollStats(
	month,
	dailyData,
	basicPay,
	otPay,
	employeeName,
) {
	const activeHolidaySet =
		typeof window !== "undefined" && window.holidaySet
			? window.holidaySet
			: new Set();
	const results = calculatePayrollResults(
		month,
		dailyData,
		activeHolidaySet,
	);
	const totals = calculatePayTotals(results, basicPay, otPay);
	renderTotalPay(results, totals, basicPay, otPay, employeeName);
	return { results, totals };
}

/**
 * Pure payroll-stat calculation used by both the browser and automated tests.
 * @param {string} month - In format "YYYY-MM".
 * @param {Array<Object>} dailyData - Daily start/end entries.
 * @param {Set<string>|Map<string, string>} holidaySet - Holiday dates.
 * @returns {Object}
 */
function calculatePayrollResults(month, dailyData, holidaySet = new Set()) {
	const [year, monthIndex] = String(month).split("-").map(Number);
	const payrollResults = {
		workingDays: 0,
		restDaysWorked: 0,
		otHours: 0,
		totalDaysWorked: 0,
		daysUntil10pm: 0,
	};

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(monthIndex) ||
		monthIndex < 1 ||
		monthIndex > 12 ||
		!Array.isArray(dailyData)
	) {
		return payrollResults;
	}

	dailyData.forEach((entry, index) => {
		const day = index + 1;
		const startTime = Number(entry?.start);
		const endTime = Number(entry?.end);

		if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return;

		const hoursWorked = endTime - startTime;
		if (hoursWorked <= 0) return;

		const date = new Date(year, monthIndex - 1, day);
		const isRestDay = checkIfRestDay(date, holidaySet);
		updatePayrollResults(payrollResults, isRestDay, hoursWorked, endTime);
	});

	return payrollResults;
}

/**
 * Checks if a date is a Sunday or an official public holiday.
 * @param {Date} date - Date to check.
 * @param {Set<string>|Map<string, string>} holidaySet - Holiday dates.
 * @returns {boolean}
 */
function checkIfRestDay(date, holidaySet = new Set()) {
	const isSunday = date.getDay() === 0;
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const dateKey = `${yyyy}-${mm}-${dd}`;
	const isPublicHoliday =
		holidaySet && typeof holidaySet.has === "function"
			? holidaySet.has(dateKey)
			: false;

	return isSunday || isPublicHoliday;
}

/**
 * Updates the payroll result accumulator for one worked day.
 * @param {Object} results - Payroll results accumulator.
 * @param {boolean} isRestDay - Whether the day is a rest day.
 * @param {number} hoursWorked - Shift duration.
 * @param {number} endTime - Shift end time.
 */
function updatePayrollResults(results, isRestDay, hoursWorked, endTime) {
	results.totalDaysWorked++;

	if (endTime === 22) {
		results.daysUntil10pm++;
	}

	if (isRestDay) {
		results.restDaysWorked += hoursWorked <= 4 ? 0.5 : 1;
		return;
	}

	results.workingDays += hoursWorked <= 4 ? 0.5 : 1;

	if (hoursWorked > 9) {
		results.otHours += hoursWorked - 9;
	}
}

/**
 * Calculates each monetary component and the final total.
 * @param {Object} results - Payroll statistics.
 * @param {number} basicPay - Daily basic pay rate.
 * @param {number} otPay - Hourly overtime rate.
 * @returns {Object}
 */
function calculatePayTotals(results, basicPay, otPay) {
	const normalizedBasicPay = Number(basicPay);
	const normalizedOtPay = Number(otPay);
	const workingPay = results.workingDays * normalizedBasicPay;
	const restDayPay = results.restDaysWorked * normalizedBasicPay * 1.5;
	const otPayTotal = results.otHours * normalizedOtPay;
	const transportPay = results.totalDaysWorked * 5;
	const foodCost = results.daysUntil10pm * 5;
	const totalPay =
		workingPay + restDayPay + otPayTotal + transportPay + foodCost;

	return {
		workingPay,
		restDayPay,
		otPayTotal,
		transportPay,
		foodCost,
		totalPay,
	};
}

/**
 * Formats a numeric value as dollars.
 * @param {number} value - Numeric value.
 * @returns {string}
 */
function formatMoney(value) {
	const num = Number(value);
	return Number.isFinite(num) ? `$${num.toFixed(2)}` : "$0.00";
}

/**
 * Safely renders the payslip using DOM text nodes.
 */
function renderTotalPay(results, totals, basicPay, otPay, employeeName) {
	const container = document.getElementById("resultContainer");
	if (!container) return;

	const section = document.createElement("section");
	section.className = "panel payroll-panel";

	const title = document.createElement("h2");
	title.className = "payslip-title";
	title.append("Payslip for: ");
	const employee = document.createElement("strong");
	employee.textContent = employeeName;
	title.appendChild(employee);
	section.appendChild(title);

	const tableWrapper = document.createElement("div");
	tableWrapper.className = "table-scroll";
	const table = document.createElement("table");
	table.className = "payslip-table";
	const tbody = document.createElement("tbody");

	appendPayslipRow(
		tbody,
		`${results.workingDays} days × ${formatMoney(basicPay)}`,
		totals.workingPay,
	);
	appendPayslipRow(
		tbody,
		`${results.restDaysWorked} rest/public holiday days × ${formatMoney(basicPay)} × 1.5`,
		totals.restDayPay,
	);
	appendPayslipRow(
		tbody,
		`OT: ${results.otHours} hours × ${formatMoney(otPay)}`,
		totals.otPayTotal,
	);
	appendPayslipRow(
		tbody,
		`Transport: ${results.totalDaysWorked} days × $5.00`,
		totals.transportPay,
	);

	if (results.daysUntil10pm > 0) {
		appendPayslipRow(
			tbody,
			`Food: ${results.daysUntil10pm} days × $5.00`,
			totals.foodCost,
		);
	}

	appendPayslipRow(tbody, "Total", totals.totalPay, "total-row");
	table.appendChild(tbody);
	tableWrapper.appendChild(table);
	section.appendChild(tableWrapper);
	container.replaceChildren(section);
}

function appendPayslipRow(tbody, label, amount, className = "") {
	const row = document.createElement("tr");
	if (className) row.className = className;

	const labelCell = document.createElement("td");
	labelCell.textContent = label;
	const amountCell = document.createElement("td");
	amountCell.textContent = `= ${formatMoney(amount)}`;

	row.append(labelCell, amountCell);
	tbody.appendChild(row);
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		calculatePayTotals,
		calculatePayrollResults,
		checkIfRestDay,
		formatMoney,
		updatePayrollResults,
	};
}
