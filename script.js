
    let chart;
    
    // Initialize the chart with empty data
    const ctx = document.getElementById('growthChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Estimated Growth',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#2563eb',
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: 'High Estimate (+Variance)',
            data: [],
            borderColor: '#10b981',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Low Estimate (-Variance)',
            data: [],
            borderColor: '#ef4444',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
              }
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Years'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '₹' + value.toLocaleString();
              }
            }
          }
        }
      }
    });

    function calculateGrowth() {
      const initial = parseFloat(document.getElementById("initial").value);
      const monthly = parseFloat(document.getElementById("monthly").value);
      const years = parseInt(document.getElementById("years").value);
      const rate = parseFloat(document.getElementById("rate").value) / 100;
      const variance = parseFloat(document.getElementById("variance").value) / 100;

      const days = years * 365;
      const dailyRate = rate / 365;

      let labels = [];
      let dataMain = [];
      let dataHigh = [];
      let dataLow = [];

      let valueMain = initial;
      let valueHigh = initial;
      let valueLow = initial;

      for (let day = 1; day <= days; day++) {
        valueMain = (valueMain + monthly / 30) * (1 + dailyRate);
        valueHigh = (valueHigh + monthly / 30) * (1 + (dailyRate + variance / 365));
        valueLow = (valueLow + monthly / 30) * (1 + Math.max(0, dailyRate - variance / 365));

        if (day % 365 === 0) {
          labels.push("Year " + (day / 365));
          dataMain.push(valueMain);
          dataHigh.push(valueHigh);
          dataLow.push(valueLow);
        }
      }

      // Update chart data
      chart.data.labels = labels;
      chart.data.datasets[0].data = dataMain;
      chart.data.datasets[1].data = dataHigh;
      chart.data.datasets[2].data = dataLow;
      chart.update();

      // Update results
      const totalInvested = initial + (monthly * 12 * years);
      const interestEarned = valueMain - totalInvested;
      const roi = ((valueMain - totalInvested) / totalInvested) * 100;
      
      document.getElementById("finalValue").textContent = "₹ " + Math.round(valueMain).toLocaleString();
      document.getElementById("totalInvested").textContent = "₹ " + Math.round(totalInvested).toLocaleString();
      document.getElementById("interestEarned").textContent = "₹ " + Math.round(interestEarned).toLocaleString();
      document.getElementById("roi").textContent = roi.toFixed(1) + "%";
      
      document.getElementById("resultCard").classList.remove("hidden");
      document.getElementById("noResult").classList.add("hidden");
    }

    // Calculate on page load
    document.addEventListener('DOMContentLoaded', function() {
      calculateGrowth();
    });