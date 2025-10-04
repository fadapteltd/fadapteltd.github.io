function generateTable() {
    const container = document.getElementById("dayTableContainer");
    container.innerHTML = ""; // Clear previous table

    const monthInput = document.getElementById("month").value;
    if (!monthInput) return;

    const [year, month] = monthInput.split("-").map(Number);

    const numDays = new Date(year, month, 0).getDate(); // Get number of days in month
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    // Create table
    const table = document.createElement("table");

    // Table Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
        <th>Date</th>
        <th>Start Time (HH)</th>
        <th>End Time (HH)</th>
    </tr>`;
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement("tbody");

    for (let day = 1; day <= numDays; day++) {
        const currentDate = new Date(year, month - 1, day);
        const isSunday = currentDate.getDay() === 0;
        const dateStr = `${monthName} ${day}, ${year}`;

        const startValue = isSunday ? 0 : 8;
        const endValue = isSunday ? 0 : 19;
        const textColor = isSunday ? 'style="color:red;"' : '';

        const row = document.createElement("tr");
        row.innerHTML = `
            <td ${textColor}>${dateStr}</td>
            <td><input type="number" name="start${day}" min="0" max="24" value="${startValue}" ${textColor} required></td>
            <td><input type="number" name="end${day}" min="0" max="24" value="${endValue}" ${textColor} required></td>
        `;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);
    attachNormalizationListeners();
}

// Attach event listeners to inputs after table generated
function attachNormalizationListeners() {
    const inputs = document.querySelectorAll('#dayTableContainer input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => normalizeTimeInput(input));
    });
}

function normalizeTimeInput(input) {
    let val = input.value;

    // Remove leading zeros
    val = val.replace(/^0+(?=\d)/, '');

    // Convert to number
    let num = Number(val);

    if (isNaN(num)) {
        num = input.min || 0;  // fallback to min or 0
    }

    // Enforce min/max bounds
    const min = input.min ? Number(input.min) : 0;
    const max = input.max ? Number(input.max) : 23;

    if (num < min) num = min;
    if (num > max) num = max;

    input.value = num;
}

function handleSubmit(event) {
    event.preventDefault(); // prevent default form submission

    // Collect form values
    const name = document.getElementById('name').value.trim();
    const basicPay = parseFloat(document.getElementById('basicPay').value);
    const otPay = parseFloat(document.getElementById('otPay').value);
    const month = document.getElementById('month').value;

    if (!name || isNaN(basicPay) || isNaN(otPay) || !month) {
        alert('Please fill out all fields correctly.');
        return false;
    }

    // Collect daily times
    const dayInputs = document.querySelectorAll('#dayTableContainer input[type="number"]');
    const dailyData = {};

    for (const input of dayInputs) {
        dailyData[input.name] = Number(input.value);
    }

    const numDays = Object.keys(dailyData).length / 2; // Each day has start + end
    const workingHours = [];

    for (let day = 1; day <= numDays; day++) {
        const start = dailyData[`start${day}`];
        const end = [`end${day}`];

        if (end <= start) {
            alert(`Error on day ${day}: End time must be greater than Start time.`);
            return false; // stop submission
        }

        const hours = end - start;
        workingHours.push(`day ${day}: ${hours}`)
    }

    const output = `Name: ${name}
        Basic Pay: ${basicPay}
        OT Pay: ${otPay}
        Working Hours: ${workingHours.join('\n')}`;

    // Example: Log data to console (replace with real submission code)
    console.log(output);

    alert('Form submitted successfully! (Check console for data)');

    return true; // page reload
}