/**
 * Calculates payroll stats based on daily start and end times.
 * @param {string} month - In format "YYYY-MM"
 * @param {Array<Object>} dailyData - Array of objects [{ start: 8, end: 19 }, ...]
 * @param {number} basicPay - Basic pay rate
 * @param {number} otPay - Overtime pay rate
 * @param {string} employeeName - Name of the employee
 */
function calculatePayrollStats(
	month,
	dailyData,
	basicPay,
	otPay,
	employeeName,
) {
	const [year, monthIndex] = month.split("-").map(Number);
	const payrollResults = {
		workingDays: 0,
		restDaysWorked: 0,
		otHours: 0,
		totalDaysWorked: 0,
		daysUntil10pm: 0,
	};

	dailyData.forEach((entry, index) => {
		const day = index + 1;
		const startTime = Number(entry.start);
		const endTime = Number(entry.end);

		// Skip invalid entries (like empty inputs)
		if (isNaN(startTime) || isNaN(endTime)) return;

		const hoursWorked = endTime - startTime;
		if (hoursWorked <= 0) return;

		const date = new Date(year, monthIndex - 1, day);
		const isRestDay = checkIfRestDay(date);

		updatePayrollResults(payrollResults, isRestDay, hoursWorked, endTime);
	});

	renderTotalPay(payrollResults, basicPay, otPay, employeeName);
}

/**
 * Checks if a given date is a rest day (Sunday or Public Holiday).
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is a rest day, false otherwise
 */
function checkIfRestDay(date) {
	const isSunday = date.getDay() === 0;

	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const dateKey = `${yyyy}-${mm}-${dd}`;

	const isPublicHoliday = window.holidaySet && window.holidaySet.has(dateKey);

	return isSunday || isPublicHoliday;
}

/**
 * Updates the payroll results object based on daily work data.
 * @param {Object} results - The payroll results accumulator
 * @param {boolean} isRestDay - Whether the day is a rest day
 * @param {number} hoursWorked - Total hours worked
 * @param {number} endTime - The end time of the shift
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
 * Formats a numeric value into a currency string.
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted currency string
 */
function formatMoney(value) {
	const num = Number(value);
	return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
}

/**
 * Calculates total pay and renders the payslip table.
 * @param {Object} results - Payroll statistics
 * @param {number} basicPay - Basic pay rate
 * @param {number} otPay - Overtime pay rate
 * @param {string} employeeName - Name of the employee
 */
function renderTotalPay(results, basicPay, otPay, employeeName) {
	const daysLate = results.daysUntil10pm;

	const workingPay = results.workingDays * basicPay;
	const restDayPay = results.restDaysWorked * basicPay * 1.5;
	const otPayTotal = results.otHours * otPay;
	const transportPay = results.totalDaysWorked * 5;
	const foodCost = daysLate > 0 ? daysLate * 5 : 0;

	const totalPay =
		workingPay + restDayPay + otPayTotal + transportPay + foodCost;

	const tableHTML = generatePayslipHTML(
		employeeName,
		results,
		basicPay,
		otPay,
		workingPay,
		restDayPay,
		otPayTotal,
		transportPay,
		foodCost,
		totalPay,
		daysLate,
	);

	const container = document.getElementById("resultContainer");
	if (container) {
		container.innerHTML = tableHTML;
	}
}

/**
 * Generates the HTML string for the payslip table.
 * @returns {string} The HTML string for the payslip
 */
function generatePayslipHTML(
	employeeName,
	results,
	basicPay,
	otPay,
	workingPay,
	restDayPay,
	otPayTotal,
	transportPay,
	foodCost,
	totalPay,
	daysLate,
) {
	let tableHTML = `
    <table style="margin-top: 20px; border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th colspan="2" style="text-align: left; font-size: 1.2em; padding-bottom: 10px;">
            Payslip for: <strong>${employeeName}</strong>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${results.workingDays} days x ${formatMoney(basicPay)}</td>
          <td>= ${formatMoney(workingPay)}</td>
        </tr>
        <tr>
          <td>${results.restDaysWorked} days x ${formatMoney(basicPay)} x 1.5</td>
          <td>= ${formatMoney(restDayPay)}</td>
        </tr>
        <tr>
          <td>OT: ${results.otHours} hours x ${formatMoney(otPay)}</td>
          <td>= ${formatMoney(otPayTotal)}</td>
        </tr>
        <tr>
          <td>Transport: ${results.totalDaysWorked} x $5.00</td>
          <td>= ${formatMoney(transportPay)}</td>
        </tr>`;

	if (daysLate > 0) {
		tableHTML += `
        <tr>
          <td>Food: ${daysLate} x $5.00</td>
          <td>= ${formatMoney(foodCost)}</td>
        </tr>`;
	}

	tableHTML += `
        <tr style="font-weight: bold;">
          <td>Total:</td>
          <td>${formatMoney(totalPay)}</td>
        </tr>
      </tbody>
    </table>
  `;

	return tableHTML;
}
