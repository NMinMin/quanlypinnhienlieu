window.addEventListener("DOMContentLoaded", () => {
  const apiID = "1CtXwFm9JJZJ8UbVJLZqWCQKLj1TR2sttuCIAfgCiZfw";
  const apiURL = `https://opensheet.elk.sh/${apiID}/Trang%20tính1`;

  const charts = {};
  let gaugeChart = null;

  const label_dienap = "Điện áp";
  const label_dongdien = "Dòng điện";
  const label_apsuat = "Áp suất vào";               // ✅ đúng
  const label_hydrogen = "Hydrogen";
  const label_nhietdo ="Nhiệt độ";

  const arrowDown = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-360 280-560h400L480-360Z"/></svg>`;
  const arrowUp = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m280-400 200-201 200 201H280Z"/></svg>`;
  const noChange = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M130-450h700v-100H130v100Z"/></svg>`;

  function parse(val) {
    return parseFloat((val || "0").toString().replace(",", "."));
  }

  function updateGaugeChart(value) {
    const color = value >= 21 ? "#28a745" : value >= 10 ? "#ffc107" : "#dc3545";
    document.getElementById("hieusuat_canhbao").style.backgroundColor = color;
    const options = {
      chart: {
        type: 'radialBar',
        height: 320,
        offsetY: 0,
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '60%' },
          track: { background: "#eee", strokeWidth: '100%' },
          dataLabels: {
            name: {
              show: true,
              fontSize: '20px',
              color: '#17a2b8',
              offsetY: -10
            },
            value: {
              formatter: val => `${parseFloat(val).toFixed(1)}%`,
              color: "#fff",
              fontSize: '24px',
              show: true,
              offsetY: 10
            }
          }
        }
      },
      fill: { colors: [color] },
      series: [value],
      labels: [value+"%"]
    };

    if (!gaugeChart) {
      const el = document.querySelector("#gauge-efficiency");
      if (!el) return console.error("❌ Không tìm thấy phần tử gauge-efficiency");
      gaugeChart = new ApexCharts(el, options);
      gaugeChart.render();
    } else {
      gaugeChart.updateSeries([value]);
      gaugeChart.updateOptions({ fill: { colors: [color] } });
    }
  }

  /*function fetchAndRender() {
    fetch(apiURL)
      .then(res => res.json())
      .then(data => {
        const recent = data.slice(-400);
        const latest = recent.at(-1);

        if (!latest) return;

        // Cập nhật đồng hồ đo hiệu suất
        updateGaugeChart(parse(latest[label_hieusuat]));

        // Cập nhật chỉ số
        document.getElementById("voltage-value").textContent = `${parse(latest[label_dienap]).toFixed(2)} V`;
        document.getElementById("current-value").textContent = `${parse(latest[label_dongdien]).toFixed(2)} A`;
        document.getElementById("power-value").textContent = `${parse(latest[label_congsuat]).toFixed(2)} W`;
        document.getElementById("h2-value").textContent = `${parse(latest[label_hydrogen]).toFixed(2)} L/m`;
        document.getElementById("temp-value").textContent = `${parse(latest["Nhiệt độ"]).toFixed(2)} °C`;
        document.getElementById("pressure-value").textContent = `${parse(latest[label_apsuat]).toFixed(2)} Pa`;

        const times = recent.map(r => r["Thời gian"]);
        const dienap = recent.map(r => parse(r[label_dienap]));
        const dongdien = recent.map(r => parse(r[label_dongdien]));
        const congsuat = recent.map(r => parse(r[label_congsuat]));
        const hydrogen = recent.map(r => parse(r[label_hydrogen]));
        const hieusuat = recent.map(r => parse(r[label_hieusuat]));
        const apsuat = recent.map(r => parse(r[label_apsuat]));


        updateChart("#chart1", "#info1", label_dienap, dienap, times, "V");
        updateChart("#chart2", "#info2", label_dongdien, dongdien, times, "A");
        updateChart("#chart3", "#info4", label_congsuat, congsuat, times, "W", updateTotal);
        updateChart("#chart4", null, label_hieusuat, hieusuat, times, "%");
        updateChart("#chart5", "#info6", label_hydrogen, hydrogen, times, "L/m");
        updateChart("#chart6", "#info7", label_apsuat, apsuat, times, "Pa");
      })
      .catch(err => console.error("❌ Lỗi khi fetch dữ liệu:", err));
  }*/
function fetchAndRender() {
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const recent = data.slice(-5000);
      const latest = recent.at(-1);

      if (!latest) return;

      // Tính toán công suất và hiệu suất từ điện áp, dòng điện, hydrogen
      const dienAp = parse(latest[label_dienap]);
      const dongDien = parse(latest[label_dongdien]);
      const hydrogen = parse(latest[label_hydrogen]);
      const congSuat = parseFloat((dienAp * dongDien).toFixed(2));
      const hieuSuat = hydrogen > 0 ? parseFloat((congSuat / (hydrogen * 59.685)).toFixed(2)) : 0;
      // Cập nhật đồng hồ đo hiệu suất
      updateGaugeChart(hieuSuat);
      
      // Cập nhật chỉ số
      document.getElementById("voltage-value").textContent = `${dienAp.toFixed(2)} V`;
      document.getElementById("current-value").textContent = `${dongDien.toFixed(2)} A`;
      document.getElementById("power-value").textContent = `${hieuSuat.toFixed(2)} %`;
      document.getElementById("h2-value").textContent = `${hydrogen.toFixed(2)} L/m`;
      document.getElementById("temp-value").textContent = `${parse(latest[label_nhietdo]).toFixed(2)} °C`;
      document.getElementById("pressure-value").textContent = `${parse(latest[label_apsuat]).toFixed(2)} Pa`;

      const value = parse(latest[label_apsuat]).toFixed(2);
      const color = value < 0.45 ? "#dc3545" : value < 0.51 ? "#28a745" : "#ffc107";
      document.getElementById("apsuat_canhbao").style.backgroundColor = color;

      const times = recent.map(r => r["Thời gian"]);
      const dienapArr = recent.map(r => parse(r[label_dienap]));
      const dongdienArr = recent.map(r => parse(r[label_dongdien]));
      const hydrogenArr = recent.map(r => parse(r[label_hydrogen]));

      // Tính lại mảng công suất và hiệu suất từ dữ liệu
      const congsuatArr = dienapArr.map((v, i) => v * dongdienArr[i]);
      const hieusuatArr = congsuatArr.map((p, i) => hydrogenArr[i] > 0 ? (p / (hydrogenArr[i] * 59.685)) : 0);

      const apsuatArr = recent.map(r => parse(r[label_apsuat]));
      const nhietdoArr = recent.map(r=> parse(r[label_nhietdo]));

      // Cập nhật biểu đồ
      updateChart("#chart1", "#info1", label_dienap, dienapArr, times, "V");
      updateChart("#chart2", "#info2", label_dongdien, dongdienArr, times, "A");
      updateChart("#chart3", "#info4", "Công suất", congsuatArr, times, "W", updateTotal);
      updateChart("#chart4", null, "Hiệu suất", hieusuatArr, times, "%");
      updateChart("#chart5", "#info6", label_hydrogen, hydrogenArr, times, "L/m");
      updateChart("#chart6", "#info7", label_apsuat, apsuatArr, times, "Pa");
      updateChart("#chart7", null, "Nhiệt độ", nhietdoArr, times, "°C");
      updateThermometer(parse(latest[label_nhietdo]));
    })
    .catch(err => console.error("❌ Lỗi khi fetch dữ liệu:", err));
}
function updateThermometer(value) {
  const color = value > 65 ? "#dc3545" : value >= 60 ? "#28a745" : "#ffc107";
  document.getElementById("nhietdo_canhbao").style.backgroundColor = color;
  const options = {
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        endingShape: 'rounded'
      }
    },
    dataLabels: { enabled: false },
    series: [{
      name: 'Nhiệt độ',
      data: [value]
    }],
    xaxis: {
      categories: [''],
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      min: 0,
      max: 100, // tùy mức tối đa nhiệt độ
      labels: {
        formatter: val => `${val}°C`
      }
    },
    fill: {
      colors: [color]
    },
    tooltip: {
      y: {
        formatter: val => `${val.toFixed(2)} °C`
      }
    },
    colors: [color]
  };

  if (!window.thermometerChart) {
    const el = document.querySelector("#thermometer");
    if (!el) return console.error("❌ Không tìm thấy phần tử thermometer");
    window.thermometerChart = new ApexCharts(el, options);
    window.thermometerChart.render();
  } else {
    window.thermometerChart.updateSeries([{ data: [value] }]);
    window.thermometerChart.updateOptions({ fill: { colors: [color] }, colors: [color] });
  }
}

function updateChart(chartID, infoID, label, values, times, unit, callback) {
  if (!values.length) return;

  // Cập nhật info (nếu có)
  const infoEl = infoID ? document.querySelector(infoID) : null;
  if (infoEl) {
    const last = values.at(-1);
    const prev = values.at(-2) ?? last;
    const icon = last > prev ? arrowUp : last < prev ? arrowDown : noChange;

    infoEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        ${icon}
        <h3 style="margin:0;">${last.toFixed(2)} ${unit}</h3>
      </div>
    `;
  }

  const chartEl = document.querySelector(chartID);
  if (!chartEl) {
    console.warn(`❌ Không tìm thấy phần tử biểu đồ: ${chartID}`);
    return;
  }

  // Cập nhật biểu đồ
  if (!charts[chartID]) {
    const options = getChartOptions(label, values, times);
    charts[chartID] = new ApexCharts(chartEl, options);
    charts[chartID].render();
  } else {
    charts[chartID].updateSeries([{ name: label, data: values }]);
    charts[chartID].updateOptions({ xaxis: { categories: times } });
  }

  // Callback nếu có
  if (typeof callback === "function") callback(values);
}



  function getChartOptions(label, values, times) {
    let color = "#F3C623";
    if (label.includes("Điện áp")) color = "#007BFF";
    else if (label.includes("Áp suất vào")) color = "#537D5D";
    else if (label.includes("Hydrogen")) color = "#00CFCF";
    else if (label.includes("Hiệu suất")) color = "#17a2b8";
    else if(label.includes("P_in")) color ="#28a745";
    else if(label.includes("Công suất")) color ="#537D5D";
    return {
      chart: {
        type: "line",
        height: 300,
        animations: { enabled: true, easing: "linear", dynamicAnimation: { speed: 300 } },
        toolbar: { show: false }
      },
      series: [{ name: label, data: values }],
      xaxis: {
        categories: times,
        labels: {
          rotate: -45,
          style: { fontSize: "10px" }
        }
      },
      yaxis: {
      labels: {
        formatter: (val) => val.toFixed(2), // 👈 Hiển thị số thập phân
        style: { fontSize: "10px" },
        },
      },
      stroke: { curve: "stepline", width: 4, colors: [color] },
      fill: { type: "solid", opacity: 0.4, color },
      colors: [color],
      tooltip: {
      y: {
        formatter: val => {
          if (label.includes("suất")) return `${val.toFixed(2)} %`;
          if (label.includes("H2")) return `${val.toFixed(2)} L/m`;
          if (label.includes("P")) return `${val.toFixed(2)} W`;
          if (label.includes("I")) return `${val.toFixed(2)} A`;
          if (label.includes("Nhiệt độ")) return `${val.toFixed(2)} °C`;
          return `${val.toFixed(2)} V`;
        }
      }
    }
    };
  }

  function updateTotal(values) {
    const total = values.reduce((a, b) => a + b, 0);
    document.getElementById("info3").innerHTML = `
      <h3 style="font-size:14px;color:#fff;">Tổng công suất tiêu thụ</h3>
      <h3 style="color:#fff;">${new Intl.NumberFormat('vi-VN').format(total.toFixed(2))} W</h3>
    `;
  }

  // Auto update
  fetchAndRender();
  setInterval(fetchAndRender, 2000);
  const toggleBtn = document.getElementById("toggle-btn");
const dateRangeContent = document.getElementById("date-range-container");
toggleBtn.addEventListener("click", function () {
  const container = document.getElementById("date-range-container");
  container.classList.toggle("show");
});
  document.getElementById("download-excel-btn").addEventListener("click", function () {
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const enhancedData = data.map(row => {
        const V = parseFloat((row["V_FC"] || "0").replace(",", "."));
        const I = parseFloat((row["I_load"] || "0").replace(",", "."));
        const H2 = parseFloat((row["V_H2"] || "0").replace(",", "."));
        const P = V * I;
        const efficiency = H2 > 0 ? P / (H2 * 59.685) : 0;

        return {
          ...row,
          "Công suất (W)": P.toFixed(2),
          "Hiệu suất (%)": efficiency.toFixed(2)
        };
      });

      const ws = XLSX.utils.json_to_sheet(enhancedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet");
      XLSX.writeFile(wb, "ToanBoDuLieu.xlsx");
      alert("✅ Đã tải Excel có thêm cột Công suất & Hiệu suất!");
    })
    .catch(err => {
      console.error("❌ Lỗi khi tải toàn bộ dữ liệu:", err);
      alert("❌ Có lỗi khi tải Excel!");
    });
});

  document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const yOffset = -200;
      const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  });
});

});
