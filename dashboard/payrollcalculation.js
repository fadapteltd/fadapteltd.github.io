/**
 * Calculates payroll stats based on daily start and end times.
 * @param {string} month - In format "YYYY-MM"
 * @param {Array} dailyData - Array of objects [{ start: 8, end: 19 }, ...]
 */
function calculatePayrollStats(month, dailyData, basicPay, otPay, name) {
	const [year, monthIndex] = month.split("-").map(Number);
	const results = {
		workingDays: 0,
		sundaysWorked: 0,
		otHours: 0,
		totalDaysWorked: 0,
		daysUntil10pm: 0,
	};

	for (let day = 1; day <= dailyData.length; day++) {
		const entry = dailyData[day - 1];
		const start = Number(entry.start);
		const end = Number(entry.end);

		// Skip invalid entries (like empty inputs)
		if (isNaN(start) || isNaN(end)) continue;

		const hoursWorked = end - start;
		if (hoursWorked <= 0) continue;

		const date = new Date(year, monthIndex - 1, day);
		const isSunday = date.getDay() === 0;

		// 1. Total days worked (any hours > 0)
		results.totalDaysWorked++;

		// 2. Days worked until 10PM
		if (end === 22) {
			results.daysUntil10pm++;
		}

		// 3. Sundays worked
		if (isSunday) {
			if (hoursWorked <= 4) {
				results.sundaysWorked += 0.5;
			} else {
				results.sundaysWorked += 1;
			}
			continue; // Do not count Sundays in normal working or OT
		}

		// 4. Regular working days (Mon–Sat)
		if (hoursWorked <= 4) {
			results.workingDays += 0.5;
		} else {
			results.workingDays += 1;
		}

		// 5. OT hours (only if > 9 hours, not on Sundays)
		if (hoursWorked > 9) {
			results.otHours += hoursWorked - 9;
		}
	}

	calculateTotalPay(results, basicPay, otPay, name);
}

/**
 * @param {Object} results
 */
function calculateTotalPay(results, basicPay, otPay, name) {
	const daysLate = results.daysUntil10pm;

	const workingPay = results.workingDays * basicPay;
	const sundayPay = results.sundaysWorked * basicPay * 1.5;
	const otPayTotal = results.otHours * otPay;
	const transportPay = results.totalDaysWorked * 5;
	const foodCost = daysLate > 0 ? daysLate * 5 : 0;

	const totalPay =
		workingPay + sundayPay + otPayTotal + transportPay + foodCost;

	// Format numbers to 2 decimals
	function formatMoney(val) {
		const num = Number(val);
		if (isNaN(num)) return "$0.00";
		return `$${val.toFixed(2)}`;
	}

	// Build table HTML
	let tableHTML = `
    <table style="margin-top: 20px; border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th colspan="2" style="text-align: left; font-size: 1.2em; padding-bottom: 10px;">
            Payslip for: <strong>${name}</strong>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr><td>${results.workingDays} days x ${formatMoney(
		basicPay
	)}</td><td>= ${formatMoney(workingPay)}</td></tr>
        <tr><td>${results.sundaysWorked} days x ${formatMoney(
		basicPay
	)} x 1.5</td><td>= ${formatMoney(sundayPay)}</td></tr>
        <tr><td>OT: ${results.otHours} hours x ${formatMoney(
		otPay
	)}</td><td>= ${formatMoney(otPayTotal)}</td></tr>
        <tr><td>Transport: ${
			results.totalDaysWorked
		} x $5.00</td><td>= ${formatMoney(transportPay)}</td></tr>`;

	if (daysLate > 0) {
		tableHTML += `<tr><td>Food: ${daysLate} x $5.00</td><td>= ${formatMoney(
			foodCost
		)}</td></tr>`;
	}

	tableHTML += `
        <tr style="font-weight: bold;"><td>Total:</td><td>${formatMoney(
			totalPay
		)}</td></tr>
      </tbody>
    </table>
  `;

	// Append to a div on the page
	document.getElementById("resultContainer").innerHTML = tableHTML;
}
