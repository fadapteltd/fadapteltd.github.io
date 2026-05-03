/**
 * Generates the timesheet table for the selected month.
 */
async function generateTable() {
	const container = document.getElementById("dayTableContainer");
	if (!container) return;

	container.innerHTML = "";

	const monthInput = document.getElementById("month").value;
	if (!monthInput) return;

	const [year, month] = monthInput.split("-").map(Number);
	const numDays = new Date(year, month, 0).getDate();
	const monthName = new Date(year, month - 1).toLocaleString("default", {
		month: "long",
	});

	window.holidaySet = await fetchPublicHolidays(year);

	const table = buildTimesheetTable(
		year,
		month,
		numDays,
		monthName,
		window.holidaySet,
	);
	container.appendChild(table);

	attachNormalizationListeners();
}

/**
 * Fetches and parses public holidays for a given year.
 * @param {number} year - The year to fetch holidays for.
 * @returns {Promise<Set<string>>} A set of holiday date strings (YYYY-MM-DD).
 */
async function fetchPublicHolidays(year) {
	const apiUrl = `https://cors-anywhere.herokuapp.com/https://api.11holidays.com/holidays/sg/${year}`;
	let holidayDates = [];

	try {
		const response = await fetch(apiUrl);
		if (response.ok) {
			const htmlText = await response.text();
			const holidays = parseNationalHolidaysFromHTML(htmlText);
			holidayDates = holidays.map((h) => h.date);
		}
	} catch (err) {
		console.error("Error fetching holidays:", err);
	}

	return new Set(holidayDates);
}

/**
 * Builds the timesheet table DOM element.
 * @param {number} year
 * @param {number} month
 * @param {number} numDays
 * @param {string} monthName
 * @param {Set<string>} holidaySet
 * @returns {HTMLTableElement}
 */
function buildTimesheetTable(year, month, numDays, monthName, holidaySet) {
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Start Time (HH)</th>
            <th>End Time (HH)</th>
        </tr>`;
	table.appendChild(thead);

	const tbody = document.createElement("tbody");

	for (let day = 1; day <= numDays; day++) {
		const currentDate = new Date(year, month - 1, day);
		const yyyy = currentDate.getFullYear();
		const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
		const dd = String(currentDate.getDate()).padStart(2, "0");
		const dateKey = `${yyyy}-${mm}-${dd}`;

		const isSunday = currentDate.getDay() === 0;
		const isPublicHoliday = holidaySet.has(dateKey);
		const isRestDay = isSunday || isPublicHoliday;

		const dateStr = `${monthName} ${day}, ${year}`;
		const startValue = isRestDay ? 0 : 8;
		const endValue = isRestDay ? 0 : 19;
		const textColor = isRestDay ? 'style="color:red;"' : "";

		const row = document.createElement("tr");
		row.innerHTML = `
            <td ${textColor}>${dateStr}</td>
            <td><input type="number" name="start${day}" min="0" max="24" value="${startValue}" ${textColor} required></td>
            <td><input type="number" name="end${day}" min="0" max="24" value="${endValue}" ${textColor} required></td>
        `;
		tbody.appendChild(row);
	}

	table.appendChild(tbody);
	return table;
}

/**
 * Parses national holidays from the HTML response.
 * @param {string} htmlText - The raw HTML string.
 * @returns {Array<Object>} List of holiday objects.
 */
function parseNationalHolidaysFromHTML(htmlText) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlText, "text/html");
	const table = doc.querySelector("#holidays");

	if (!table) {
		console.error("No table with id='holidays' found!");
		return [];
	}

	const rows = table.querySelectorAll("tbody tr");
	return Array.from(rows)
		.map((tr) => {
			const tds = tr.querySelectorAll("td");
			return {
				date: tds[0]?.getAttribute("data-date")?.trim() || "",
				day: tds[1]?.textContent.trim() || "",
				name: tds[2]?.textContent.trim() || "",
				type: tds[3]?.textContent.trim() || "",
			};
		})
		.filter((item) => item.type.toLowerCase().includes("national holiday"));
}

/**
 * Attaches event listeners to normalize time inputs.
 */
function attachNormalizationListeners() {
	const inputs = document.querySelectorAll(
		'#dayTableContainer input[type="number"]',
	);
	inputs.forEach((input) => {
		input.addEventListener("blur", () => normalizeTimeInput(input));
	});
}

/**
 * Normalizes a time input field ensuring bounds and correct numeric format.
 * @param {HTMLInputElement} input - The input element to normalize.
 */
function normalizeTimeInput(input) {
	let val = input.value;
	val = val.replace(/^0+(?=\d)/, "");
	let num = Number(val);

	if (isNaN(num)) {
		num = input.min ? Number(input.min) : 0;
	}

	const min = input.min ? Number(input.min) : 0;
	const max = input.max ? Number(input.max) : 23;

	input.value = Math.max(min, Math.min(max, num));
}

/**
 * Handles the submission of the payroll input form.
 * @param {Event} event - The form submission event.
 * @returns {boolean} False if validation fails, true otherwise.
 */
function handleSubmit(event) {
	event.preventDefault();

	const name = document.getElementById("name").value.trim();
	const basicPay = parseFloat(document.getElementById("basicPay").value);
	const otPay = parseFloat(document.getElementById("otPay").value);
	const month = document.getElementById("month").value;

	if (!name || isNaN(basicPay) || isNaN(otPay) || !month) {
		alert("Please fill out all fields correctly.");
		return false;
	}

	const [year, monthNum] = month.split("-").map(Number);
	const numDays = new Date(year, monthNum, 0).getDate();
	const dailyData = [];

	for (let day = 1; day <= numDays; day++) {
		const startInput = document.querySelector(`input[name="start${day}"]`);
		const endInput = document.querySelector(`input[name="end${day}"]`);

		if (!startInput || !endInput) {
			alert(`Missing time input for day ${day}.`);
			return false;
		}

		const start = Number(startInput.value || 0);
		const end = Number(endInput.value || 0);

		if (isNaN(start) || isNaN(end)) {
			alert(`Invalid time entry on day ${day}.`);
			return false;
		}

		if (!(start === 0 && end === 0) && end <= start) {
			alert(`End time must be greater than start time on day ${day}.`);
			return false;
		}

		dailyData.push({ start, end });
	}

	calculatePayrollStats(month, dailyData, basicPay, otPay, name);
	return true;
}
