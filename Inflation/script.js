// Static fallback data
const fallbackInflationData = {
  2020: 5000,
  2021: 4570,
  2022: 3810,
  2023: 2640,
  2024: 2340,
  2025: 2140
};

// DOM elements
const timeline = document.getElementById("timeline");
const slider = document.getElementById("yearSlider");
const yearText = document.getElementById("selectedYear");
const noteValue = document.getElementById("noteValue");
const equivalentValue = document.getElementById("equivalentValue");
const overlay = document.getElementById("noteOverlay");
const apiStatus = document.getElementById("apiStatus");
const currentValue = document.getElementById("currentValue");
const currentYear = document.getElementById("currentYear");
const valueLoss = document.getElementById("valueLoss");
let inflationChart;

// API status types
const API_STATUS = {
  CHECKING: 'checking',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Update API status display
function updateApiStatus(status, message) {
  const statusConfig = {
    [API_STATUS.CHECKING]: {
      className: 'api-status-checking',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
    },
    [API_STATUS.SUCCESS]: {
      className: 'api-status-success',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
    },
    [API_STATUS.ERROR]: {
      className: 'api-status-error',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>'
    }
  };
  
  const config = statusConfig[status];
  apiStatus.className = `api-status ${config.className}`;
  apiStatus.innerHTML = `<svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${config.icon}</svg><span>${message}</span>`;
}

// Fetch inflation data
async function fetchInflationData() {
  try {
    updateApiStatus(API_STATUS.CHECKING, 'Fetching data from World Bank API...');
    
    const res = await fetch("https://api.worldbank.org/v2/country/PK/indicator/FP.CPI.TOTL.ZG?format=json&date=2020:2025");
    
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    
    if (!data || !data[1] || data[1].length === 0) {
      throw new Error("No data returned from API");
    }
    
    let values = { 2020: 5000 };
    let base = 5000;

    data[1]
      .filter(d => d.date >= 2021 && d.date <= 2025 && d.value !== null)
      .sort((a, b) => a.date - b.date)
      .forEach(d => {
        base = base / (1 + (d.value || 0) / 100);
        values[d.date] = Math.round(base);
      });

    for (let year = 2020; year <= 2025; year++) {
      if (values[year] === undefined) {
        values[year] = fallbackInflationData[year];
      }
    }
    
    updateApiStatus(API_STATUS.SUCCESS, 'Live data from The World Bank API');
    return values;
  } catch (err) {
    console.warn("API failed, using fallback data", err);
    updateApiStatus(API_STATUS.ERROR, 'Using fallback data (API unavailable)');
    return fallbackInflationData;
  }
}

// Render timeline
function renderTimeline(data) {
  timeline.innerHTML = "";
  
  for (let year = 2020; year <= 2025; year++) {
    const value = data[year];
    const loss = 5000 - value;
    const percentLoss = ((loss / 5000) * 100).toFixed(1);
    const remainingPercent = (100 - percentLoss).toFixed(1);
    
    const card = document.createElement("div");
    card.className = "timeline-card fade-in";
    card.innerHTML = `
      <div class="timeline-card-year">${year}</div>
      <div class="timeline-card-value">${value.toLocaleString()} PKR</div>
      <div class="timeline-card-detail">Value: <strong>${percentLoss}%</strong> less than 2020</div>
      <div class="timeline-card-bar">
        <div class="timeline-card-fill" style="width: ${remainingPercent}%"></div>
      </div>
    `;
    
    timeline.appendChild(card);
  }
}

// Nicely format a number as PKR with commas, or return a placeholder for invalid input
function formatPKR(value) {
  const n = Number(value);
  if (!isFinite(n)) return '—';
  return n.toLocaleString() + ' PKR';
}

// Update only the year (call when the user picks a different year)
function setSelectedYear(year) {
  document.getElementById('selectedYear').textContent = year;
}

// Update only the original amount shown (call when user edits the "amount" input)
function setNoteValue(amount) {
  document.getElementById('noteValue').textContent = formatPKR(amount);
}

// Update only the computed equivalent value (call after you compute inflation adjustment)
function setEquivalentValue(amount) {
  document.getElementById('equivalentValue').textContent = formatPKR(amount);
}

// Update slider and values
function updateSlider(year, data) {
  const numericYear = parseInt(year);
  const value = data[numericYear] ?? 5000;
  const loss = 5000 - value;
  
  // Update the selected year
  setSelectedYear(year);
  
  // Update the note value (original amount in the selected year)
  setNoteValue(5000);
  
  // Update the equivalent value (what that amount is worth today)
  setEquivalentValue(value);
  
  // Update other UI elements
  currentValue.textContent = formatPKR(value);
  currentYear.textContent = year;
  valueLoss.textContent = formatPKR(loss);
  
  // Update the overlay
  const fadePercent = 100 - (value / 5000) * 100;
  overlay.style.width = `${fadePercent}%`;
}

// Create chart
function createChart(data) {
  const ctx = document.getElementById('inflationChart').getContext('2d');
  
  const years = Object.keys(data);
  const values = Object.values(data);
  
  if (inflationChart) {
    inflationChart.destroy();
  }
  
  inflationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Value of 5000 PKR',
        data: values,
        backgroundColor: 'rgba(146, 115, 108, 0.1)',
        borderColor: 'rgb(146, 115, 108)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(146, 115, 108)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Value: ${context.raw.toLocaleString()} PKR`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.min(...values) - 200,
          title: {
            display: true,
            text: 'Value in PKR',
            color: '#6b6b6b'
          },
          grid: {
            color: 'rgba(229, 214, 217, 0.8)'
          },
          ticks: {
            color: '#6b6b6b',
            callback: function(value) {
              return value.toLocaleString() + ' PKR';
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Year',
            color: '#6b6b6b'
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#6b6b6b'
          }
        }
      }
    }
  });
}

// Initialize application
async function init() {
  const inflationData = await fetchInflationData();
  renderTimeline(inflationData);
  createChart(inflationData);

  slider.addEventListener("input", () => {
    updateSlider(slider.value, inflationData);
  });

  updateSlider(slider.value, inflationData);
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);