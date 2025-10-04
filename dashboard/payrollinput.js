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
    event.preventDefault();

    // Get inputs
    const name = document.getElementById('name').value.trim();
    const basicPay = parseFloat(document.getElementById('basicPay').value);
    const otPay = parseFloat(document.getElementById('otPay').value);
    const month = document.getElementById('month').value;

    if (!name || isNaN(basicPay) || isNaN(otPay) || !month) {
        alert('Please fill out all fields correctly.');
        return false;
    }

    // Get number of days in selected month
    const [year, monthNum] = month.split('-').map(Number);
    const numDays = new Date(year, monthNum, 0).getDate();

    const workingHours = [];

    for (let day = 1; day <= numDays; day++) {
        const startInput = document.querySelector(`input[name="start${day}"]`);
        const endInput = document.querySelector(`input[name="end${day}"]`);

        if (!startInput || !endInput) {
            workingHours.push(`day ${day}: missing data`);
            continue;
        }

        const start = Number(startInput.value);
        const end = Number(endInput.value);

        // Validate: end must be greater than start, except for 0 (e.g., Sunday off)
        if (start !== 0 || end !== 0) {
            if (end <= start) {
                alert(`Error on day ${day}: End time must be greater than Start time.`);
                return false;
            }
        }

        const hours = end - start;
        workingHours.push(`day ${day}: ${hours}`);
    }

    // Final formatted output
    const output = `Name: ${name}
    Basic Pay: ${basicPay}
    OT Pay: ${otPay}
    Working Hours:
    ${workingHours.join('\n')}`;

    console.log(output);
    alert("Form submitted successfully! Check the console for output.");
    return true;
}
