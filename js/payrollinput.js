const HOLIDAY_API_URL =
	"https://data.gov.sg/api/action/datastore_search?resource_id=d_8ef23381f9417e4d4254ee8b4dcdb176&limit=500";
const HOLIDAY_SNAPSHOT_URL = "../data/sg-public-holidays.json";
const HOLIDAY_REQUEST_TIMEOUT_MS = 8000;

let liveHolidayDatasetPromise = null;
let bundledHolidayDatasetPromise = null;
let tableGenerationId = 0;

/**
 * Generates the timesheet table for the selected month.
 */
async function generateTable() {
	const generationId = ++tableGenerationId;
	const container = document.getElementById("dayTableContainer");
	const resultContainer = document.getElementById("resultContainer");
	if (!container) return;

	container.replaceChildren();
	if (resultContainer) resultContainer.replaceChildren();
	window.holidayMap = new Map();
	window.holidaySet = new Set();
	window.holidayDataReady = false;
	setSubmitEnabled(false);

	const monthInput = document.getElementById("month").value;
	if (!monthInput) {
		setHolidayStatus(
			"Select a month to load official Singapore public holidays.",
			"",
		);
		return;
	}

	const [year, month] = monthInput.split("-").map(Number);
	const numDays = new Date(year, month, 0).getDate();
	const monthName = new Intl.DateTimeFormat("en-SG", {
		month: "long",
	}).format(new Date(year, month - 1, 1));

	setHolidayStatus(`Loading official public holidays for ${year}…`, "loading");

	try {
		const holidayData = await fetchPublicHolidays(year);

		if (
			generationId !== tableGenerationId ||
			document.getElementById("month").value !== monthInput
		) {
			return;
		}

		window.holidayMap = holidayData.holidayMap;
		window.holidaySet = new Set(holidayData.holidayMap.keys());
		window.holidayDataReady = true;

		const table = buildTimesheetTable(
			year,
			month,
			numDays,
			monthName,
			holidayData.holidayMap,
		);
		const tableWrapper = document.createElement("div");
		tableWrapper.className = "table-scroll";
		tableWrapper.appendChild(table);
		container.appendChild(tableWrapper);

		attachNormalizationListeners();
		setSubmitEnabled(true);

		const sourceNote =
			holidayData.source === "bundled"
				? " from the bundled official snapshot"
				: " from the live data.gov.sg dataset";
		setHolidayStatus(
			`Loaded ${holidayData.holidayMap.size} public holiday dates for ${year}${sourceNote}.`,
			"success",
		);
	} catch (error) {
		if (generationId !== tableGenerationId) return;

		window.holidayMap = new Map();
		window.holidaySet = new Set();
		window.holidayDataReady = false;
		console.error("Unable to load verified public holidays:", error);
		setHolidayStatus(
			`Verified public holiday data is unavailable for ${year}. The payslip calculation is disabled to prevent an inaccurate result.`,
			"warning",
		);
	}
}

/**
 * Fetches official Singapore public holidays from the bundled snapshot first,
 * then checks the live dataset when the requested year is not bundled.
 * @param {number} year - The year to load.
 * @returns {Promise<{holidayMap: Map<string, string>, source: string}>}
 */
async function fetchPublicHolidays(year) {
	let bundledError = null;

	try {
		const bundledRecords = await fetchBundledHolidayDataset();
		const holidayMap = normalizeHolidayRecords(bundledRecords, year);
		if (holidayMap.size > 0) {
			return { holidayMap, source: "bundled" };
		}
		bundledError = new Error(`The bundled dataset has no records for ${year}.`);
	} catch (error) {
		bundledError = error;
	}

	try {
		const liveRecords = await fetchLiveHolidayDataset();
		const holidayMap = normalizeHolidayRecords(liveRecords, year);
		if (holidayMap.size > 0) {
			return { holidayMap, source: "live" };
		}
		throw new Error(`The live dataset has no records for ${year}.`);
	} catch (liveError) {
		throw new Error(
			`Holiday lookup failed. Bundled source: ${getErrorMessage(bundledError)} Live source: ${getErrorMessage(liveError)}`,
		);
	}
}

async function fetchLiveHolidayDataset() {
	if (!liveHolidayDatasetPromise) {
		liveHolidayDatasetPromise = fetchJson(HOLIDAY_API_URL).then((payload) => {
			const records = payload?.result?.records;
			if (!payload?.success || !Array.isArray(records)) {
				throw new Error("data.gov.sg returned an unexpected response.");
			}
			return records;
		});
	}

	return liveHolidayDatasetPromise;
}

async function fetchBundledHolidayDataset() {
	if (!bundledHolidayDatasetPromise) {
		bundledHolidayDatasetPromise = fetchJson(HOLIDAY_SNAPSHOT_URL).then(
			(payload) => {
				if (!Array.isArray(payload?.holidays)) {
					throw new Error("The bundled holiday file is invalid.");
				}
				return payload.holidays;
			},
		);
	}

	return bundledHolidayDatasetPromise;
}

async function fetchJson(url) {
	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		HOLIDAY_REQUEST_TIMEOUT_MS,
	);

	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) {
			throw new Error(`Request returned HTTP ${response.status}.`);
		}
		return await response.json();
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Converts holiday records into a validated date-to-name map for one year.
 * @param {Array<Object>} records - Holiday records containing date and holiday.
 * @param {number} year - Requested year.
 * @returns {Map<string, string>}
 */
function normalizeHolidayRecords(records, year) {
	if (!Array.isArray(records) || !Number.isInteger(year)) {
		return new Map();
	}

	const yearPrefix = `${year}-`;
	const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
	const holidayMap = new Map();

	records.forEach((record) => {
		const date = String(record?.date || "").trim();
		const holiday = String(record?.holiday || record?.name || "").trim();

		if (
			date.startsWith(yearPrefix) &&
			isoDatePattern.test(date) &&
			holiday
		) {
			holidayMap.set(date, holiday);
		}
	});

	return holidayMap;
}

/**
 * Builds the timesheet table DOM element.
 * @param {number} year
 * @param {number} month
 * @param {number} numDays
 * @param {string} monthName
 * @param {Map<string, string>} holidayMap
 * @returns {HTMLTableElement}
 */
function buildTimesheetTable(year, month, numDays, monthName, holidayMap) {
	const table = document.createElement("table");
	table.className = "timesheet-table";
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");

	["Date", "Start Time (HH)", "End Time (HH)"].forEach((label) => {
		const header = document.createElement("th");
		header.scope = "col";
		header.textContent = label;
		headerRow.appendChild(header);
	});

	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");

	for (let day = 1; day <= numDays; day++) {
		const currentDate = new Date(year, month - 1, day);
		const yyyy = currentDate.getFullYear();
		const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
		const dd = String(currentDate.getDate()).padStart(2, "0");
		const dateKey = `${yyyy}-${mm}-${dd}`;
		const isSunday = currentDate.getDay() === 0;
		const holidayName = holidayMap.get(dateKey) || "";
		const isRestDay = isSunday || Boolean(holidayName);
		const startValue = isRestDay ? 0 : 8;
		const endValue = isRestDay ? 0 : 19;

		const row = document.createElement("tr");
		const dateCell = document.createElement("td");
		dateCell.textContent = `${monthName} ${day}, ${year}`;

		if (isRestDay) {
			dateCell.classList.add("rest-day");
			const note = document.createElement("span");
			note.className = "day-note";
			note.textContent = holidayName || "Sunday rest day";
			dateCell.appendChild(note);
		}

		row.appendChild(dateCell);
		row.appendChild(
			createTimeInputCell(`start${day}`, startValue, isRestDay),
		);
		row.appendChild(createTimeInputCell(`end${day}`, endValue, isRestDay));
		tbody.appendChild(row);
	}

	table.appendChild(tbody);
	return table;
}

function createTimeInputCell(name, value, isRestDay) {
	const cell = document.createElement("td");
	const input = document.createElement("input");
	input.type = "number";
	input.name = name;
	input.min = "0";
	input.max = "24";
	input.step = "1";
	input.value = String(value);
	input.required = true;
	input.setAttribute(
		"aria-label",
		name.startsWith("start") ? "Start time" : "End time",
	);
	if (isRestDay) input.classList.add("rest-day");
	cell.appendChild(input);
	return cell;
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
	let val = String(input.value).replace(/^0+(?=\d)/, "");
	let num = Number(val);

	if (Number.isNaN(num)) {
		num = input.min ? Number(input.min) : 0;
	}

	const min = input.min ? Number(input.min) : 0;
	const max = input.max ? Number(input.max) : 24;
	input.value = String(Math.max(min, Math.min(max, num)));
}

/**
 * Handles the submission of the payroll input form.
 * @param {Event} event - The form submission event.
 * @returns {boolean} False because the form is handled in the browser.
 */
function handleSubmit(event) {
	event.preventDefault();

	if (!window.holidayDataReady) {
		alert("Verified public holiday data must load before calculating pay.");
		return false;
	}

	const name = document.getElementById("name").value.trim();
	const basicPay = Number.parseFloat(document.getElementById("basicPay").value);
	const otPay = Number.parseFloat(document.getElementById("otPay").value);
	const month = document.getElementById("month").value;

	if (
		!name ||
		!Number.isFinite(basicPay) ||
		!Number.isFinite(otPay) ||
		basicPay < 0 ||
		otPay < 0 ||
		!month
	) {
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

		const start = Number(startInput.value);
		const end = Number(endInput.value);

		if (
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			start < 0 ||
			end < 0 ||
			start > 24 ||
			end > 24
		) {
			alert(`Invalid time entry on day ${day}. Use a value from 0 to 24.`);
			return false;
		}

		if (!(start === 0 && end === 0) && end <= start) {
			alert(`End time must be greater than start time on day ${day}.`);
			return false;
		}

		dailyData.push({ start, end });
	}

	calculatePayrollStats(month, dailyData, basicPay, otPay, name);
	return false;
}

function setHolidayStatus(message, state) {
	const status = document.getElementById("holidayStatus");
	if (!status) return;
	status.textContent = message;
	if (state) {
		status.dataset.state = state;
	} else {
		delete status.dataset.state;
	}
}

function setSubmitEnabled(isEnabled) {
	const submitButton = document.getElementById("submitButton");
	if (submitButton) submitButton.disabled = !isEnabled;
}

function getErrorMessage(error) {
	return error instanceof Error ? error.message : String(error || "Unknown error.");
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		normalizeHolidayRecords,
		normalizeTimeInput,
	};
}
