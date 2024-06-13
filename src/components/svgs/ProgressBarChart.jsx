import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ProgressBarChart = () => {
    const ref = useRef();

    useEffect(() => {
        const svg = d3.select(ref.current);
        svg.selectAll('*').remove(); // Clear previous content

        const width = 700;
        const height = 600;
        const margin = { top: 50, right: 150, bottom: 120, left: 50 };

        // Load data
        d3.csv('src/assets/data/VN_World_East_Neonatal_mortality.csv')
            .then((data) => {
                // Extract the year part from TIME_PERIOD and filter for required years
                const filteredData = data.filter((d) =>
                    ['1990', '2000', '2010', '2020'].includes(d.TIME_PERIOD.split('-')[0]),
                );

                // Extract relevant columns and convert to proper types
                const formattedData = filteredData.map((d) => ({
                    area: d['Geographic area'],
                    year: d.TIME_PERIOD.split('-')[0],
                    value: +d.OBS_VALUE,
                }));

                const nestedData = d3.groups(
                    formattedData,
                    (d) => d.area,
                    (d) => d.year,
                );

                const x0 = d3
                    .scaleBand()
                    .domain(nestedData.map((d) => d[0]))
                    .range([margin.left, width - margin.right])
                    .paddingInner(0.2); // Increased padding

                const x1 = d3
                    .scaleBand()
                    .domain(['1990', '2000', '2010', '2020'])
                    .range([10, x0.bandwidth()])
                    .padding(0.05);

                const y = d3
                    .scaleLinear()
                    .domain([0, d3.max(formattedData, (d) => d.value)])
                    .nice()
                    .range([height - margin.bottom, margin.top]);

                const color = d3
                    .scaleOrdinal()
                    .domain([...new Set(formattedData.map((d) => d.area))])
                    .range(['#1f77b4', '#ff7f0e', '#2ca02c']); // Custom colors for areas

                // Add grid lines
                const yAxisGrid = d3
                    .axisLeft(y)
                    .tickSize(-width + margin.left + margin.right)
                    .tickFormat('')
                    .ticks(5);
                svg.append('g')
                    .attr('class', 'grid')
                    .attr('transform', `translate(${margin.left},0)`)
                    .call(yAxisGrid)
                    .selectAll('line')
                    .attr('stroke', 'rgba(0, 0, 0, 0.1)');

                svg.append('g')
                    .attr('transform', `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(x0).tickSizeOuter(0).tickFormat(''));

                svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

                const areaGroups = svg
                    .append('g')
                    .selectAll('g')
                    .data(nestedData)
                    .enter()
                    .append('g')
                    .attr('transform', (d) => `translate(${x0(d[0])},0)`);

                areaGroups
                    .selectAll('rect')
                    .data((d) => d[1])
                    .enter()
                    .append('rect')
                    .attr('x', (d) => x1(d[0]))
                    .attr('y', y(0))
                    .attr('width', x1.bandwidth() - 5)
                    .attr('height', 0)
                    .attr('fill', (d) => color(d[1][0].area))
                    .transition()
                    .duration(1000)
                    .attr('y', (d) => y(d[1][0].value))
                    .attr('height', (d) => y(0) - y(d[1][0].value));

                // Tooltips
                const tooltip = d3
                    .select('body')
                    .append('div')
                    .style('position', 'absolute')
                    .style('opacity', 0)
                    .style('background', '#fff')
                    .style('border', '1px solid #ccc')
                    .style('padding', '10px')
                    .style('pointer-events', 'none')
                    .style('border-radius', '4px')
                    .style('font', '12px sans-serif');

                areaGroups
                    .selectAll('rect')
                    .on('mouseover', function (event, d) {
                        tooltip.transition().duration(200).style('opacity', 0.9);
                        tooltip
                            .style('opacity', 1)
                            .style('left', `${event.pageX + 10}px`)
                            .style('top', `${event.pageY - 28}px`)
                            .html(`
                                <div style="background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                                    <h4 style="margin: 0; font-size: 14px;">${d[1][0].area}</h4>
                                    <p style="margin: 0; font-size: 12px;">Year: ${d[0]}</p>
                                    <p style="margin: 0; font-size: 12px;">Rate: ${d[1][0].value}</p>
                                </div>
                            `);
                    })
                    .on('mouseout', function () {
                        tooltip.transition().duration(500).style('opacity', 0);
                    });

                // Calculate percentage change and annotate
                const percentageChange = (a, b) => (((b - a) / a) * 100).toFixed(1);
                const annotations = [];

                for (const area of [...new Set(formattedData.map((d) => d.area))]) {
                    const areaData = formattedData.filter((d) => d.area === area);
                    for (const year of ['2000', '2010', '2020']) {
                        const currentData = areaData.find((d) => d.year === year);
                        const previousData = areaData.find((d) => d.year === String(+year - 10));
                        if (currentData && previousData) {
                            annotations.push({
                                year,
                                area,
                                value: currentData.value,
                                previousValue: previousData.value,
                                change: percentageChange(previousData.value, currentData.value),
                            });
                        }
                    }
                }

                const annotationGroups = areaGroups
                    .selectAll('.annotation')
                    .data((d) => annotations.filter((a) => a.area === d[0]))
                    .enter()
                    .append('g')
                    .attr('class', 'annotation')
                    .attr('transform', (d) => {
                        const previousYearIndex = ['1990', '2000', '2010', '2020'].indexOf(String(+d.year - 10));
                        const currentYearIndex = ['1990', '2000', '2010', '2020'].indexOf(d.year);
                        const midX = (x1.bandwidth() / 2) * (previousYearIndex + currentYearIndex + 1);
                        return `translate(${midX}, 0)`;
                    });

                annotationGroups
                    .append('rect')
                    .attr('x', -15)
                    .attr('y', (d) => y(d.previousValue) - 30)
                    .attr('width', 50)
                    .attr('height', 20)
                    .attr('rx', 10) // Rounded corners for oval shape
                    .attr('ry', 10)
                    .attr('fill', 'lightsteelblue');

                annotationGroups
                    .append('text')
                    .attr('x', 10)
                    .attr('y', (d) => y(d.previousValue) - 10)
                    .attr('dy', '-0.5em')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('fill', 'black')
                    .text((d) => `${d.change}%`);

                // Add legend for areas at the bottom
                const legend = svg
                    .append('g')
                    .attr('transform', `translate(${margin.left}, ${height - margin.bottom + 40})`);

                const legendData = [...new Set(formattedData.map((d) => d.area))];

                // Add "percentage change" to the legend data
                legendData.push('Percentage Change');

                // Calculate the maximum width of the legend texts
                const maxTextWidth = d3.max(legendData, (d) => d.length);

                // Set the spacing between legend items based on the maximum text width
                const legendSpacing = maxTextWidth * 6; // Adjust the multiplier as needed

                legend
                    .selectAll('g')
                    .data(legendData)
                    .enter()
                    .append('g')
                    .attr('transform', (d, i) => `translate(${i * legendSpacing}, 0)`)
                    .each(function (d) {
                        const g = d3.select(this);
                        g.append('rect')
                            .attr('width', 15)
                            .attr('height', 15)
                            .attr('y', 4)
                            .attr('fill', d === 'Percentage Change' ? 'lightsteelblue' : color(d));
                        g.append('text')
                            .attr('x', 20)
                            .attr('y', 12.5)
                            .attr('dy', '0.32em')
                            .attr('font-size', '12px')
                            .attr('fill', 'black')
                            .text(d);
                    });
                // Add year labels under each group of bars
                svg.append('g')
                    .selectAll('g')
                    .data(nestedData)
                    .enter()
                    .append('g')
                    .attr('transform', (d) => `translate(${x0(d[0])},${height - margin.bottom + 20})`)
                    .selectAll('text')
                    .data((d) => d[1])
                    .enter()
                    .append('text')
                    .attr('x', (d) => x1(d[0]) + x1.bandwidth() / 2)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('fill', 'black')
                    .text((d) => d[0]);

                // Add chart title
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', margin.top / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '16px')
                    .attr('font-weight', 'bold')
                    .text('Mortality Rate Comparison (1990, 2000, 2010, 2020)');

                // Add y-axis label
                svg.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('x', -height / 2)
                    .attr('y', margin.left / 2)
                    .attr('dy', '0.01em')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .text('Mortality Rate');
            })
            .catch((error) => {
                console.error('Error loading or parsing data:', error);
            });
    }, []);

    return <svg ref={ref} width={600} height={600}></svg>;
};

export default ProgressBarChart;
