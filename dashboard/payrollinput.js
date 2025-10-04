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
        const dateStr = `${monthName} ${day}, ${year}`;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${dateStr}</td>
          <td><input type="number" name="start${day}" min="0" max="23" value="8" required></td>
          <td><input type="number" name="end${day}" min="0" max="23" value="19" required></td>
        `;
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      container.appendChild(table);
    }