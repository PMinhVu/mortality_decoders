import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = () => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear the previous data content

        const width = 700;
        const height = 550;
        const margin = { top: 50, right: 30, bottom: 100, left: 60 };

        d3.csv('src/assets/data/VietNam_33years.csv')
            .then((data) => {
                // Filter data for the selected country
                const countryData = data.filter((d) => d['Geographic area'] === 'Viet Nam');

                // Filter data for the latest year
                const latestYearData = countryData.filter((d) => +d.TIME_PERIOD.split('-')[0] === 2021);

                // Group data by indicators
                const indicatorData = d3.rollup(
                    latestYearData,
                    (v) => d3.sum(v, (d) => +d.OBS_VALUE),
                    (d) => d.Indicator,
                );

                // Define the order of indicators
                const indicatorOrder = [
                    'Neonatal mortality rate',
                    'Child Mortality rate age 1-4',
                    'Mortality rate age 5-9',
                    'Mortality rate age 10-14',
                    'Mortality rate age 15-19',
                ];

                // Filter and sort data based on the defined order
                const indicators = indicatorOrder.filter((indicator) => indicatorData.has(indicator));
                const values = indicators.map((indicator) => indicatorData.get(indicator));

                // Set up scales
                const x = d3
                    .scaleBand()
                    .domain(indicators)
                    .range([margin.left, width - margin.right])
                    .padding(0.2);
                const y = d3
                    .scaleLinear()
                    .domain([0, d3.max(values) + 1])
                    .nice()
                    .range([height - margin.bottom, margin.top]);
                const color = d3
                    .scaleLinear()
                    .domain([0, d3.max(values)])
                    .range(['lightblue', '#08306b']);

                // Add x-axis
                svg.append('g')
                    .attr('transform', `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(x))
                    .selectAll('text')
                    .attr('y', 15)
                    .style('font-size', '10px')
                    .style('text-anchor', 'center');

                // Add y-axis
                svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

                // Add grid lines
                svg.append('g')
                    .attr('class', 'grid')
                    .attr('transform', `translate(${margin.left},0)`)
                    .call(
                        d3
                            .axisLeft(y)
                            .tickSize(-width + margin.left + margin.right)
                            .tickFormat(''),
                    )
                    .selectAll('line')
                    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
                    .attr('stroke-dasharray', '2,2');

                // Add bars with dynamic fill color based on value and hover effect
                svg.selectAll('.bar')
                    .data(indicators)
                    .enter()
                    .append('rect')
                    .attr('class', 'bar')
                    .attr('x', (d) => x(d))
                    .attr('y', height - margin.bottom)
                    .attr('width', x.bandwidth())
                    .attr('height', 0)
                    .attr('fill', (d) => color(indicatorData.get(d)))
                    .attr('rx', 5) // Add rounded corners
                    .attr('ry', 5)
                    .on('mouseover', function (event, d) {
                        d3.select(this).transition().duration(200).attr('fill', 'orange');
                        tooltip.transition().duration(200).style('opacity', 0.9);
                        tooltip
                            .html(`<strong>${d}</strong><br>Value: ${indicatorData.get(d).toFixed(2)}`)
                            .style('left', `${event.pageX + 15}px`)
                            .style('top', `${event.pageY - 28}px`);
                    })
                    .on('mouseout', function (event, d) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('fill', color(indicatorData.get(d)));
                        tooltip.transition().duration(200).style('opacity', 0);
                    })
                    .transition()
                    .duration(1000)
                    .attr('y', (d) => y(indicatorData.get(d)))
                    .attr('height', (d) => height - margin.bottom - y(indicatorData.get(d)));

                // Add labels with background rectangles
                svg.selectAll('.label')
                    .data(indicators)
                    .enter()
                    .append('text')
                    .attr('class', 'label')
                    .attr('x', (d) => x(d) + x.bandwidth() / 2)
                    .attr('y', (d) => y(indicatorData.get(d)) - 10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .attr('font-weight', 'bold')
                    .text((d) => indicatorData.get(d).toFixed(2))
                    .each(function () {
                        const bbox = this.getBBox();
                        svg.insert('rect', '.label')
                            .attr('x', bbox.x - 4)
                            .attr('y', bbox.y - 4)
                            .attr('width', bbox.width + 8)
                            .attr('height', bbox.height + 8)
                            .attr('fill', '#08306b')
                            .attr('opacity', 0.8)
                            .attr('rx', 4) // Add rounded corners to the background rectangles
                            .attr('ry', 4);
                    });

                // Add chart title
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', margin.top / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '16px')
                    .attr('font-weight', 'bold')
                    .text(`Distribution of Mortality Rates by Age Group in Vietnam in 2021`);

                // Add x-axis label
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', height - margin.bottom / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .attr('font-weight', 'bold')
                    .text('Indicators');

                // Add y-axis label
                svg.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('x', -height / 2)
                    .attr('y', margin.left / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .attr('font-weight', 'bold')
                    .text('Values');

                // Tooltip
                const tooltip = d3
                    .select('body')
                    .append('div')
                    .attr('class', 'tooltip1')
                    .style('position', 'absolute')
                    .style('opacity', 0)
                    .style('background', '#fff')
                    .style('border', '1px solid #ccc')
                    .style('padding', '10px')
                    .style('pointer-events', 'none')
                    .style('border-radius', '4px')
                    .style('font-size', '12px');
            })
            .catch((error) => {
                console.error('Error loading or parsing data:', error);
            });
    }, []);

    return (
        <div>
            <svg ref={svgRef} width={800} height={550}></svg>
        </div>
    );
};

export default BarChart;
