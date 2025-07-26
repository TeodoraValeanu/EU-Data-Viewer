# EU Indicators Visualizer

This project is a web-based application that visualizes key indicators (GDP per capita, Life Expectancy, Population) for European Union countries between 2000–2018 using real data from the Eurostat API.

## 🚀 Features

- 📥 **Auto-fetch** latest 15 years of data from Eurostat API on load
- 📈 **Line chart (SVG)** for selected country and indicator
- 🖱️ **Tooltip** on hover showing year and value
- 🫧 **Bubble chart (Canvas)** for a selected year:
  - X-axis: GDP per capita
  - Y-axis: Life expectancy
  - Bubble size: Population
- 🎞️ **Bubble chart animation** across all available years
- 📊 **Table view** (to be added): indicator values for selected year with color-coded cells vs EU average

## 📦 Technologies

- HTML, CSS, JavaScript
- SVG for line charts
- Canvas for bubble charts
- [Eurostat API](https://wikis.ec.europa.eu/display/EUROSTATHELP/API+Statistics+-+data+query)

## 🌍 Data Sources

- GDP per capita: `sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB`
- Life Expectancy: `demo_mlexpec?sex=T&age=Y1`
- Population: `demo_pjan?sex=T&age=TOTAL`

## 🧪 How to Run

Just open `index.html` in a browser and click **"Fetch Data"** to load and visualize the dataset. Internet connection is required for the API calls.

## 👩‍💻 Author

**Teodora-Iulia Valeanu**  
Multimedia Project – 2025  
Bucharest University of Economic Studies – Business Informatics
