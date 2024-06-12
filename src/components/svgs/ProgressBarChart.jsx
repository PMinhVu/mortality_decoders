import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ProgressBarChart = () => {
    const ref = useRef();

    useEffect(() => {
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove(); // Clear previous content

        const width = 960;
        const height = 600;
        const margin = { top: 50, right: 150, bottom: 120, left: 70 };

        // Load data
        d3.csv('src/assets/data/VN_World_East_Neonatal_mortality.csv').then(data => {
            // Extract the year part from TIME_PERIOD and filter for required years
            const filteredData = data.filter(d => ['1990', '2000', '2010', '2020'].includes(d.TIME_PERIOD.split('-')[0]));

            // Extract relevant columns and convert to proper types
            const formattedData = filteredData.map(d => ({
                area: d['Geographic area'],
                year: d.TIME_PERIOD.split('-')[0],
                value: +d.OBS_VALUE
            }));

            const nestedData = d3.groups(formattedData, d => d.area, d => d.year);

            const x0 = d3.scaleBand()
                .domain(nestedData.map(d => d[0]))
                .range([margin.left, width - margin.right])
                .paddingInner(0.2); // Increased padding

            const x1 = d3.scaleBand()
                .domain(['1990', '2000', '2010', '2020'])
                .range([0, x0.bandwidth()])
                .padding(0.05);

            const y = d3.scaleLinear()
                .domain([0, d3.max(formattedData, d => d.value)]).nice()
                .range([height - margin.bottom, margin.top]);

            const color = d3.scaleOrdinal()
                .domain([...new Set(formattedData.map(d => d.area))])
                .range(["#1f77b4", "#ff7f0e", "#2ca02c"]); // Custom colors for areas

            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x0).tickSizeOuter(0).tickFormat(''));

            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));

            const areaGroups = svg.append("g")
                .selectAll("g")
                .data(nestedData)
                .enter().append("g")
                .attr("transform", d => `translate(${x0(d[0])},0)`);

            areaGroups.selectAll("rect")
                .data(d => d[1])
                .enter().append("rect")
                .attr("x", d => x1(d[0]))
                .attr("y", d => y(d[1][0].value))
                .attr("width", x1.bandwidth()-5)
                .attr("height", d => y(0) - y(d[1][0].value))
                .attr("fill", d => color(d[1][0].area));

            // Calculate percentage change and annotate
            const percentageChange = (a, b) => ((b - a) / a * 100).toFixed(1);
            const annotations = [];

            for (const area of [...new Set(formattedData.map(d => d.area))]) {
                const areaData = formattedData.filter(d => d.area === area);
                for (const year of ['2000', '2010', '2020']) {
                    const currentData = areaData.find(d => d.year === year);
                    const previousData = areaData.find(d => d.year === String(+year - 10));
                    if (currentData && previousData) {
                        annotations.push({
                            year,
                            area,
                            value: currentData.value,
                            previousValue: previousData.value,
                            change: percentageChange(previousData.value, currentData.value)
                        });
                    }
                }
            }

            const annotationGroups = areaGroups.selectAll(".annotation")
                .data(d => annotations.filter(a => a.area === d[0]))
                .enter().append("g")
                .attr("class", "annotation")
                .attr("transform", d => {
                    const previousYearIndex = ['1990', '2000', '2010', '2020'].indexOf(String(+d.year - 10));
                    const currentYearIndex = ['1990', '2000', '2010', '2020'].indexOf(d.year);
                    const midX = (x1.bandwidth() / 2) * (previousYearIndex + currentYearIndex + 1);
                    return `translate(${midX}, 0)`;
                });

            annotationGroups.append("rect")
                .attr("x", -25)
                .attr("y", d => y(d.previousValue) - 30)
                .attr("width", 50)
                .attr("height", 20)
                .attr("rx", 10) // Rounded corners for oval shape
                .attr("ry", 10)
                .attr("fill", "lightsteelblue");
            
            annotationGroups.append("text")
                .attr("x", 0)
                .attr("y", d => y(d.previousValue) - 10)
                .attr("dy", "-0.5em")
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "black")
                .text(d => `${d.change}%`);
                

            // Add legend for areas at the bottom
            const legend = svg.append("g")
                .attr("transform", `translate(${margin.left + 220}, ${height - margin.bottom + 60})`); // Adjusted position

            const legendData = [...new Set(formattedData.map(d => d.area))];
            legend.selectAll("g")
                .data(legendData)
                .enter().append("g")
                .attr("transform", (d, i) => `translate(${i * 150}, 0)`)
                .each(function(d) {
                    const g = d3.select(this);
                    g.append("rect")
                        .attr("width", 15)
                        .attr("height", 15)
                        .attr('y', 4)
                        .attr("fill", color(d));
                    g.append("text")
                        .attr("x", 20)
                        .attr("y", 12.5)
                        .attr("dy", "0.32em")
                        .attr("font-size", "12px")
                        .attr("fill", "black")
                        .text(d);
                });

            // Add year labels under each group of bars
            svg.append("g")
                .selectAll("g")
                .data(nestedData)
                .enter().append("g")
                .attr("transform", d => `translate(${x0(d[0])},${height - margin.bottom + 20})`)
                .selectAll("text")
                .data(d => d[1])
                .enter().append("text")
                .attr("x", d => x1(d[0]) + x1.bandwidth() / 2)
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "black")
                .text(d => d[0]);

            svg.append("text")
                .attr("x", width / 2)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("font-weight", "bold")
                .text("Mortality Rate Comparison (1990, 2000, 2010, 2020)");
        }).catch(error => {
            console.error('Error loading or parsing data:', error);
        });
    }, []);

    return <svg ref={ref} width={960} height={600}></svg>;
};


export default ProgressBarChart;
