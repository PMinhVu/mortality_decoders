import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CustomBarChart = () => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const width = 600;
        const height = 550;
        const margin = { top: 50, right: 30, bottom: 100, left: 60 };

        const areas = ['Viet Nam', 'East Asia and Pacific', 'World'];
        const indicatorType = ['Mortality rate 1-59 months', 'Neonatal mortality rate'];
        Promise.all([
            d3.csv('/src/assets/data/VN_World_East_Mortality.csv'),
            d3.csv('/src/assets/data/VN_World_East_Neonatal_Mortality.csv'),
        ])
            .then(([overallData, neonatalData]) => {
                const combinedData = [];

                // Process overall data
                overallData.forEach((d) => {
                    if (areas.includes(d['Geographic area']) && indicatorType[0] === d['Indicator']) {
                        combinedData.push({
                            area: d['Geographic area'],
                            type: indicatorType[0],
                            rate: +d['OBS_VALUE'],
                        });
                    }
                });

                // Process neonatal data
                neonatalData.forEach((d) => {
                    if (areas.includes(d['Geographic area']) && indicatorType[1] === d['Indicator']) {
                        combinedData.push({
                            area: d['Geographic area'],
                            type: indicatorType[1],
                            rate: +d['OBS_VALUE'],
                        });
                    }
                });

                const x0 = d3
                    .scaleBand()
                    .domain(areas)
                    .range([margin.left, width - margin.right])
                    .padding(0.2);
                const x1 = d3.scaleBand().domain(indicatorType).range([0, x0.bandwidth()]).padding(0.4);
                const y = d3
                    .scaleLinear()
                    .domain([0, d3.max(combinedData, (d) => d.rate)])
                    .nice()
                    .range([height - margin.bottom, margin.top]);

                const color = d3.scaleOrdinal().domain(indicatorType).range(['#1f77b4', '#ff7f0e']);

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
                    .call(d3.axisBottom(x0).tickSize(0))
                    .selectAll('text')
                    .style('text-anchor', 'middle')
                    .attr('dy', '1.5em'); // Move labels down

                svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

                // Add vertical lines
                areas.forEach((area) => {
                    indicatorType.forEach((type) => {
                        const dataPoint = combinedData.find((d) => d.area === area && d.type === type);
                        if (dataPoint) {
                            svg.append('line')
                                .attr('x1', x0(area) + x1(type) + x1.bandwidth() / 2)
                                .attr('x2', x0(area) + x1(type) + x1.bandwidth() / 2)
                                .attr('y1', y(0))
                                .attr('y2', y(0))
                                .attr('stroke', 'gray')
                                .attr('stroke-width', 3)
                                .transition()
                                .duration(1000)
                                .attr('y2', y(dataPoint.rate));

                            svg.append(type === indicatorType[0] ? 'circle' : 'rect')
                                .attr(type === indicatorType[0] ? 'cx' : 'x', x0(area) + x1(type) + x1.bandwidth() / 2)
                                .attr(type === indicatorType[0] ? 'cy' : 'y', y(0))
                                .attr('width', type === indicatorType[1] ? 10 : null)
                                .attr('height', type === indicatorType[1] ? 10 : null)
                                .attr('r', type === indicatorType[0] ? 5 : null)
                                .attr('fill', color(type))
                                .attr(
                                    'transform',
                                    `translate(${type === indicatorType[1] ? -5 : 0},${
                                        type === indicatorType[1] ? -5 : 0
                                    })`,
                                )
                                .transition()
                                .duration(1000)
                                .attr(type === indicatorType[0] ? 'cy' : 'y', y(dataPoint.rate));

                            // Add tooltip
                            svg.append('circle')
                                .attr('cx', x0(area) + x1(type) + x1.bandwidth() / 2)
                                .attr('cy', y(dataPoint.rate))
                                .attr('r', 0)
                                .attr('fill', 'none')
                                .attr('pointer-events', 'all')
                                .on('mouseover', function (event) {
                                    tooltip.transition().duration(200).style('opacity', 0.9);
                                    tooltip
                                        .html(
                                            `<strong>${area}</strong>: ${dataPoint.rate.toFixed(
                                                2,
                                            )} per 1,000 live births`,
                                        )
                                        .style('left', `${event.pageX + 10}px`)
                                        .style('top', `${event.pageY - 28}px`);
                                })
                                .on('mouseout', function () {
                                    tooltip.transition().duration(200).style('opacity', 0);
                                })
                                .transition()
                                .duration(1000)
                                .attr('r', 10)
                                .attr('fill', 'transparent');
                        }
                    });
                });
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
                    .style('font-size', '12px');

                const legend = svg
                    .append('g')
                    .attr('class', 'legend')
                    .attr(
                        'transform',
                        `translate(${width / 2 - indicatorType.length * 75}, ${height - margin.bottom + 50})`,
                    );

                indicatorType.forEach((type, index) => {
                    const legendRow = legend.append('g').attr('transform', `translate(${index * 170}, 0)`);

                    legendRow
                        .append(type === indicatorType[0] ? 'circle' : 'rect')
                        .attr(type === indicatorType[0] ? 'cx' : 'x', 2)
                        .attr(type === indicatorType[0] ? 'cy' : 'y', type === indicatorType[0] ? 4 : -2)
                        .attr('width', type === indicatorType[1] ? 10 : 5)
                        .attr('height', type === indicatorType[1] ? 10 : 5)
                        .attr('r', type === indicatorType[0] ? 5 : 0)
                        .attr('fill', color(type));

                    legendRow
                        .append('text')
                        .attr('x', 15)
                        .attr('y', 5)
                        .text(type)
                        .attr('font-size', '12px')
                        .attr('alignment-baseline', 'middle');
                });

                // Add chart title
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', margin.top / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '20px')
                    .attr('font-weight', 'bold')
                    .text('Comparison of Mortality Rates for the Two Age Groups with the Highest Rates');

                // Add y-axis label
                svg.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('x', -height / 2)
                    .attr('y', margin.left / 2)
                    .attr('dy', '-1em')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .text('Mortality Rate (per 1,000 live births)');
            })
            .catch((error) => {
                console.error('Error loading or processing data:', error);
            });
    });

    return (
        <div>
            <svg ref={svgRef} width={700} height={550}></svg>
        </div>
    );
};

export default CustomBarChart;
