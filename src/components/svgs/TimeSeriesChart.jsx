import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// eslint-disable-next-line react/prop-types
const TimeSeries = ({ indicator, country }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear the previous data content

        const width = 800;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        // Create a tooltip div that is hidden by default
        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('padding', '5px')
            .style('background', 'lightsteelblue')
            .style('border', '0px')
            .style('border-radius', '8px')
            .style('pointer-events', 'none')
            .style('font', '12px sans-serif')
            .style('opacity', 0); // Set initial opacity to 0

        d3.csv('src/assets/data/combined_dataset.csv').then((data) => {
            const parseDate = d3.timeParse('%Y');

            const filteredData = data.filter((d) => d.Indicator === indicator && d.Area === country);

            console.log('Filtered Data:', filteredData);

            const x = d3
                .scaleTime()
                .domain(d3.extent(filteredData, (d) => parseDate(d.TIME_PERIOD)))
                .range([margin.left, width - margin.right]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(filteredData, (d) => +d.OBS_VALUE)])
                .nice()
                .range([height - margin.bottom, margin.top]);

            const xAxis = (g) =>
                g.attr('transform', `translate(0,${height - margin.bottom})`).call(
                    d3
                        .axisBottom(x)
                        .ticks(width / 80)
                        .tickFormat(d3.timeFormat('%Y'))
                        .tickSizeOuter(0),
                );

            const yAxis = (g) => g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

            svg.append('g').call(xAxis);
            svg.append('g').call(yAxis);

            const line = d3
                .line()
                .x((d) => x(parseDate(d.TIME_PERIOD)))
                .y((d) => y(+d.OBS_VALUE));

            svg.append('path')
                .datum(filteredData)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
                .attr('d', line);

            // Add vertical lines
            svg.selectAll('.vertical-line')
                .data(filteredData)
                .enter()
                .append('line')
                .attr('class', 'vertical-line')
                .attr('x1', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('x2', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('y1', margin.top)
                .attr('y2', height - margin.bottom)
                .attr('stroke', 'lightgray')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4')
                .style('opacity', 0); // Initially hidden

            // Add dots
            svg.selectAll('dot')
                .data(filteredData)
                .enter()
                .append('circle')
                .attr('cx', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('cy', (d) => y(+d.OBS_VALUE))
                .attr('r', 5)
                .attr('fill', 'steelblue')
                .on('mouseover', function (event, d) {
                    d3.select(this).attr('r', 8).attr('fill', 'orange');
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip
                        .html(`<b>Year:</b> ${d.TIME_PERIOD}<br/><b>Value:</b> ${(+d.OBS_VALUE).toFixed(2)}`)
                        .style('left', event.pageX + 10 + 'px')
                        .style('top', event.pageY - 10 + 'px');
                    if (new Date(d.TIME_PERIOD).getFullYear() !== 2012) {
                        svg.selectAll('.vertical-line')
                            .filter((lineData) => lineData === d)
                            .style('opacity', 1); // Show the vertical line
                    }
                })
                .on('mouseout', function () {
                    d3.select(this).attr('r', 5).attr('fill', 'steelblue');
                    tooltip.transition().duration(500).style('opacity', 0);
                    svg.selectAll('.vertical-line').style('opacity', 0); // Initially hidden
                });
        });
    }, [indicator, country]);

    return (
        <div>
            <svg ref={svgRef} width={800} height={400}></svg>
        </div>
    );
};

export default TimeSeries;
