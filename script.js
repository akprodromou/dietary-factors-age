// Function to clear the column names of the data frame
function removeDots(str) {
    return str.replace(/\./g, ' ');
  }
 
// Import data
d3.csv(
  "https://raw.githubusercontent.com/akprodromou/dietary-factors-age/refs/heads/main/dietary_factors_per_age_GR.csv"
).then(function (data) {
  // Dynamically get all column names from the data
  const allColumns = Object.keys(data[0]);

  // Define initially excluded columns
  const excludedColumns = ["age", "Total.omega.6.fat", "Other.starchy.vegetables", "Vitamin.A.with.supplements", "Potatoes", "Total.seafoods"];

  // Add columns containing 'Vita' to the excluded list (Vitamins)
  allColumns.forEach(column => {
    if (column.includes('Vita')) {
      excludedColumns.push(column);
    }
  });

  // Filter columns to plot, excluding those in the excluded list
  const columnsToPlot = allColumns.filter(
    (column) => !excludedColumns.includes(column)
  );

  // Exclude the last 3 rows of the data to limit the age range to 78.5 rather than 100
  const filteredData = data.slice(0, -4);

  // Parse data
  const chartData = filteredData.map((d) => ({
    // Make sure age is given in decimals
    age: parseFloat(d.age),
    // Iterate over the columns and create a new object. Each key-value pair in the array becomes a property-value pair in the new object
    ...Object.fromEntries(columnsToPlot.map((col) => [col, parseFloat(d[col])]))
  }));

  // Find max value and corresponding age for each column (nutritient)
  const columnMaxInfo = columnsToPlot.map(col => {
    const maxValue = d3.max(chartData, d => d[col]);
    const maxAge = chartData.find(d => d[col] === maxValue).age;
    return { column: col, maxValue, maxAge };
  });

  // Sort columns by maxAge (ascending order)
  const sortedColumns = columnMaxInfo.sort((a, b) => a.maxAge - b.maxAge);
  
  // Dimensions and layout
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartHeight = 85; // Height for each chart
  const titleMargin = 135; // Space for title and subtitle
  const width = 800 - margin.left - margin.right;
  const height = 1130;
  
  // Create SVG container
  const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  // Shared x-scale
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(chartData, (d) => d.age)])
    .range([100, width - 400])
    .nice(); // extend the domain to get to 80 in the axis

  // Add shared x-axis top
  svg.append("g")
    .attr("class","axis")
    .attr("transform", `translate(200, ${((chartHeight - 75)) + titleMargin})`)
    .call(d3.axisTop(xScale)
  );

  // Group bottom x-axis and its label
  const xAxisGroup = svg.append("g")
    .attr("class", "axis-group");

  // Add shared x-axis bottom
  xAxisGroup.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(200, ${((chartHeight - 59.25) * sortedColumns.length) + titleMargin})`)
    .call(d3.axisBottom(xScale));

  // Add x-axis bottom label
  xAxisGroup.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", `${width / 2 + 50}`)
    .attr("y", `${((chartHeight - 59.2) * (sortedColumns.length + 1.70)) + titleMargin}`)
    .text("Age");

  // Add vertical grid lines
  for (let x = 105; x <= 355; x += 30) {
      svg
      .append('line')
      .style("class", "gridLine")
      .style("stroke", "#9a9a9a")
      .style("stroke-width", 0.4)
      .attr("x1", x + 195)
      .attr("y1", titleMargin + 15)
      .attr("x2", x + 195)
      .attr("y2", titleMargin + 845);
      }  

  // Add the main title text
  svg.append("text")
      .attr("class", "main-title")
      .attr("text-anchor", "start")
      .attr("x", 0) // Center the title horizontally
      .attr("y", margin.top + 33) // Position the title slightly below the top margin
      .text("How Does Age Shape Our Diet?");
      

  // Add the subtitle text
  svg.append("text")
      .attr("class", "subtitle")
      .attr("text-anchor", "start")
      .attr("x", 0) // Center the title horizontally
      .attr("y", margin.top + 70) // Position the title slightly below the top margin
      .text("Greek population dietary intake stratified by age");
  
  // Iterate over sorted columns and generate charts
  sortedColumns.forEach(({ column: col }, i) => {
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d[col])])
      .range([chartHeight - 1.5* margin.bottom, margin.top]);

    // Create a group for each chart
    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(200, ${(titleMargin + i * (chartHeight - 60))})`); 

    // Find data point with max value
    const maxDataPoint = chartData.find(d => d[col] === d3.max(chartData, d => d[col]));

    // Create a color scale for circles
    const colorScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.age)]) // Domain: age range
    .range(["#6a87a1", "#04213b"]); // Range: colors from light blue to dark blue

    // Add area path 
    chartGroup
      .append("path")
      .datum(chartData)
      .attr("fill", "#9a9a9a") 
      .attr("fill-opacity", 0)
      .attr("stroke", "#04213b")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.25)
      .attr("d",d3.area()
          .x((d) => xScale(d.age))
          .y0((d) => yScale(d[col])*.99)
          .y1((d) => yScale(d[col]))
      );

    // Add respective chart titles to the left
    chartGroup
        .append("text")
        .attr("class", "chart-title")
        .attr("x", - 200)
        .attr("y", chartHeight - 55)
        .text(removeDots(col));

    // Add horizontal grid lines
    chartGroup
        .append('line')
        .style("class", "gridLine")
        .style("stroke", "#9a9a9a")
        .style("stroke-width", 0.4)
        .attr("x1", - 200)
        .attr("y1", yScale(0) - 0)
        .attr("x2", 345)
        .attr("y2", yScale(0) - 0);

    // Calculate circle position based on max value and xScale
    const circleX = xScale(maxDataPoint.age);
    const circleY = yScale(maxDataPoint.col);

    // Add circle representing max value
    chartGroup
      .append("circle")
      .attr("class", "circle") 
      .attr("cx", circleX + 3)
      .attr("cy", 20)
      .attr("r", 6)
      .style("stroke-width", 0)
      .attr("fill", d => colorScale(maxDataPoint.age)) 
      .attr("stroke", "none") 
      .attr("opacity", 1)
      .attr("data-maxAge", maxDataPoint.age) // Attach max data point age
      .attr("data-column", removeDots(col)); // Attach column name

    // Create a tooltip
    var tooltip = d3.select("#my_dataviz")
      .append("div")
      .attr("class", "tooltip") 
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #9a9a9a")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("z-index", "100");

    // Add tooltip interactivity
    d3.selectAll(".circle")
      .on("mouseover", function(event) {
        const maxAge = d3.select(this).attr("data-maxAge");
        const column = d3.select(this).attr("data-column");
        tooltip
          .html(`${column}<br>Age: ${maxAge}`) 
          .style("visibility", "visible");
      })
      .on("mousemove", function(event) {
        const x = event.offsetX;
        const y = event.offsetY;
      
        tooltip
          .style("top", (y + 10) + "px")
          .style("left", (x + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });
  });

  // Data source footnote
  svg.append("text")
  .attr("x", 0) 
  .attr("y", 1080) 
  .attr("class", "referenceText")
  .attr("text-anchor", "start")
  .selectAll("tspan")
  .data([
    "Data Source: GDD 2018 Estimates and Datafiles, accessed December 2024"
  ])
  .enter()
  .append("tspan")
  .attr("x", 0) 
  .attr("dy", (d, i) => i * 18) 
  .text((d) => d);

  // Legend
  svg.append("text")
    .attr("class", "legend")
    .attr("x", 21)
    .attr("y", 1030)
    .text("Max value");

  svg.append("circle")
    .attr("class", "circleLegend") 
    .attr("cx", 6)
    .attr("cy", 1025)
    .attr("r", 6)
    .style("stroke-width", 0)
    .attr("fill", "#4a5e70") 
    .attr("stroke", "none") 
    .attr("opacity", 1);

});


