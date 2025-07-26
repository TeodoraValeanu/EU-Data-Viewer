document.getElementById('fetch-data').addEventListener('click', fetchDataFromAPI);
document.getElementById('show-graph').addEventListener('click', showGraph);
document.getElementById('show-bubble-chart').addEventListener('click', showBubbleChart);
document.getElementById('animate-bubble-chart').addEventListener('click', animateBubbleChart);
document.getElementById('stop-animation').addEventListener('click', stopAnimation);

let processedData = []; //datele procesate

const tari = [
  "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", 
  "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"
];

const ani = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i); 

function buildAPIUrl(baseUrl, extraParams = {}) {
  const geoParams = tari.map(country => `geo=${country}`).join("&");
  const timeParams = ani.map(year => `time=${year}`).join("&");

  //construire url pe baza API
  const queryParams = Object.entries(extraParams)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

  return `${baseUrl}?${queryParams}&${geoParams}&${timeParams}`;
}



//preluarea datelor din API-ul Eurostat
async function fetchDataFromAPI() {
  const indicators = [
      {
          name: "SV", 
          baseUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec",
          params: { sex: "T", age: "Y1" }
      },
      {
          name: "POP", 
          baseUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan",
          params: { sex: "T", age: "TOTAL" }
      },
      {
          name: "PIB", 
          baseUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sdg_08_10",
          params: { na_item: "B1GQ", unit: "CLV10_EUR_HAB" }
      }
  ];

  processedData = []; //resetam datele procesate

  try {
      for (const indicator of indicators) {
          const url = buildAPIUrl(indicator.baseUrl, indicator.params);
          const response = await fetch(url);
          const data = await response.json();
          const indicatorData = processEurostatData(data, indicator.name);
          processedData = processedData.concat(indicatorData);
      }
      populateDropdown(); //actualizare dropdown dupa preluarea datelor
      alert('Datele au fost incarcate.');
  } catch (error) {
      console.error("Eroare la preluarea datelor:", error);
  }
}



function processEurostatData(data, indicator) {
  const processedData = [];
  const geo = data.dimension.geo.category.index; 
  const time = data.dimension.time.category.index; 
  const values = data.value;

  for (const countryCode in geo) {
      for (const year in time) {
          const position = geo[countryCode] * Object.keys(time).length + time[year];
          const value = values[position];

          if (value !== undefined) {
              processedData.push({
                  Country: countryCode,
                  Year: parseInt(year),
                  Indicator: indicator,
                  Value: parseFloat(value),
              });
          }
      }
  }
  return processedData;
}


function populateDropdown() {
  const countrySelect = document.getElementById('country-select');
  const tari = [...new Set(processedData.map(item => item.Country))];
  countrySelect.innerHTML = tari
      .map(country => `<option value="${country}">${country}</option>`)
      .join('');
}


function showGraph() {
  const country = document.getElementById('country-select').value;
  const indicator = document.getElementById('indicator-select').value;

  if (!country || !indicator) {
      alert('Selecteaza o tara si un indicator.');
      return;
  }

  const data = processedData.filter(item => item.Country === country && item.Indicator === indicator);

  if (data.length === 0) {
      alert('Ooops! Nu exista date...');
      return;
  }

  const ani = data.map(item => item.Year);
  const values = data.map(item => item.Value);

  drawGraph(ani, values, indicator);
}


function drawGraph(ani, values, indicator) {
  const svg = document.getElementById('graph');
  const tooltip = document.getElementById('tooltip');
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');

  svg.innerHTML = ''; //se goleste graficul anterior

  const padding = 60;
  const maxVal = Math.max(...values);

  //valorile de pe axe
  const xAxa = year => ((year - Math.min(...ani)) / (Math.max(...ani) - Math.min(...ani))) * (width - 2 * padding) + padding;
  const yAxa = value => height - ((value / maxVal) * (height - 2 * padding)) - padding;

  //afisarea axei x
  ani.forEach(year => {
      const x = xAxa(year);
      svg.innerHTML += `<line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 5}" stroke="black" />`;
      svg.innerHTML += `<text x="${x}" y="${height - padding + 20}" font-size="10" text-anchor="middle">${year}</text>`;
  });

  //afisarea axei y
  for (let i = 0; i <= 5; i++) {
      const value = (i / 5) * maxVal;
      const y = yAxa(value);
      svg.innerHTML += `<line x1="${padding}" y1="${y}" x2="${padding - 5}" y2="${y}" stroke="black" />`;
      svg.innerHTML += `<text x="${padding - 10}" y="${y}" font-size="10" text-anchor="end">${Math.round(value)}</text>`;
  }

  //desenează linia graficului
  const lineData = [];
  for (let i = 0; i < ani.length - 1; i++) {
      const x1 = xAxa(ani[i]);
      const y1 = yAxa(values[i]);
      const x2 = xAxa(ani[i + 1]);
      const y2 = yAxa(values[i + 1]);
      svg.innerHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="blue" stroke-width="2" />`;

      //salvam datele pt tooltip
      lineData.push({ year: ani[i], value: values[i], x: x1, y: y1 });
  }

  //adaugam evenimentul de mouse pentru tooltip
  svg.addEventListener('mousemove', event => {
      const rect = svg.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      //cautam cel mai apropiat punct
      const closestPoint = lineData.reduce((prev, curr) =>
          Math.abs(curr.x - mouseX) < Math.abs(prev.x - mouseX) ? curr : prev
      );

      //apoi afisam tooltip-ul
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = 'block';
      tooltip.innerHTML = `
          <strong>An:</strong> ${closestPoint.year}<br>
          <strong>${indicator}:</strong> ${closestPoint.value.toFixed(2)}
      `;
  });

  svg.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
  });
}

//populam meniul dropdown pentru bubblechart
function populateYearDropdownBubble() {
  const yearSelectBubble = document.getElementById('year-select-bubble');
  yearSelectBubble.innerHTML = ani
      .map(year => `<option value="${year}">${year}</option>`)
      .join('');
}

//afisam bubblechart
function showBubbleChart() {
  const year = parseInt(document.getElementById('year-select-bubble').value);
  if (!year) {
      alert('Selecteaza un an.');
      return;
  }

  const canvas = document.getElementById('bubble-chart');
  const ctx = canvas.getContext('2d');
  const padding = 100;
  const maxBubbleSize = 80; 

  //filtram datele pentru anul selectat
  const yearData = processedData.filter(item => item.Year === year);

  if (yearData.length === 0) {
      alert('Nu există date pentru anul selectat.');
      return;
  }

  //gasim valorile maxime pentru scalare
  const maxPopulation = Math.max(...yearData.filter(d => d.Indicator === 'POP').map(d => d.Value));
  const maxPIB = Math.max(...yearData.filter(d => d.Indicator === 'PIB').map(d => d.Value));
  const maxLifeExpectancy = Math.max(...yearData.filter(d => d.Indicator === 'SV').map(d => d.Value));

  //golim graficul precedent
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  const xAxa = value => ((value / maxPIB) * (canvas.width - 2 * padding)) + padding; //PIB pe axa X
  const yAxa = value => canvas.height - (((value / maxLifeExpectancy) * (canvas.height - 2 * padding)) + padding); //SV pe axa Y
  const sizeScale = value => Math.sqrt(value / maxPopulation) * maxBubbleSize + 5; 
  //folosim radacina patrata pentru o distributie mai uniforma
  //Dimensiunea cercului in functie de populatie

  //desenam cercurile
  yearData.forEach(data => {
      if (data.Indicator === 'POP') return; //ignoram datele de populatie

      const country = data.Country;

      const pibData = yearData.find(d => d.Country === country && d.Indicator === 'PIB');
      const svData = yearData.find(d => d.Country === country && d.Indicator === 'SV');
      const popData = yearData.find(d => d.Country === country && d.Indicator === 'POP');

      if (pibData && svData && popData) {
          const x = xAxa(pibData.Value);
          const y = yAxa(svData.Value);
          const size = sizeScale(popData.Value);

          //evitam ca bulele sa fie decupate/sa nu incapa in canvas
          const adjustedX = Math.max(padding + size, Math.min(x, canvas.width - padding - size));
          const adjustedY = Math.max(padding + size, Math.min(y, canvas.height - padding - size));

          //cercurile
          ctx.beginPath();
          ctx.arc(adjustedX, adjustedY, size, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(30, 144, 255, 0.7)';
          ctx.fill();
          ctx.stroke();

          //textul tarii
          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText(country, adjustedX - size / 2, adjustedY - size - 5);
      }
  });

  //axele graficului
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  //axa X-PIB
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.font = '12px Arial';
  ctx.fillText('PIB', canvas.width - 40, canvas.height - padding + 20);

  //axa Y-SV
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  ctx.fillText('SV', padding - 30, padding - 10);

  //valorile de pe axa X(PIB)
  const xSteps = 5; //numar de valori afisate
  for (let i = 0; i <= xSteps; i++) {
      const value = (maxPIB / xSteps) * i;
      const x = xAxa(value);
      ctx.fillText(value.toFixed(0), x, canvas.height - padding + 15); //afisam valoarea sub axa
      ctx.beginPath();
      ctx.moveTo(x, canvas.height - padding - 5);
      ctx.lineTo(x, canvas.height - padding + 5);
      ctx.stroke(); //liniutza pe axa
  }

  //valori pe axa Y-SV
  const ySteps = 5; //Numar de valori afisate
  for (let i = 0; i <= ySteps; i++) {
      const value = (maxLifeExpectancy / ySteps) * i;
      const y = yAxa(value);
      ctx.fillText(value.toFixed(1), padding - 40, y + 5); //afisam valoarea in stanga axei
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding + 5, y);
      ctx.stroke(); //liniutza de pe axa y
  }
}

populateYearDropdownBubble();


let animationRunning = false; //var globala pentru controlul animatiei
let animationTimeout; //var pentru referinta timeout-ului


function animateBubbleChart() {

  const canvas = document.getElementById('bubble-chart');
  const ctx = canvas.getContext('2d');
  const ani = [...new Set(processedData.map(item => item.Year))].sort(); //toti anii disponibili, ordonati
  const delay = 1000; //intârziere dintre cadre(in milisecunde)
  let currentYearIndex = 0;

  animationRunning = true; //pornim animatia

  function drawNextFrame() {
      if (!animationRunning || currentYearIndex >= ani.length) {
          animationRunning = false; //oprim animatia daca a ajuns la final
          return;
      }

      const year = ani[currentYearIndex];
      document.getElementById('year-select-bubble').value = year; //actualizeaza dropdown-ul
      showBubbleChart(); //deseneaza graficul pentru anul curent

      currentYearIndex++;
      animationTimeout = setTimeout(drawNextFrame, delay); //trece la urmatorul an
  }

  drawNextFrame(); //pornim animatia
}



function stopAnimation() {
  animationRunning = false; //opreste animatia
  clearTimeout(animationTimeout); //opreste urmatorul timeout
}
