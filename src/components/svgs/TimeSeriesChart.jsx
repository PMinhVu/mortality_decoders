import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// eslint-disable-next-line react/prop-types
const TimeSeries = ({ country }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear the previous data content

        const width = 800;
        const height = 550;
        const margin = { top: 150, right: 30, bottom: 30, left: 40 };

        const showTooltips = (dotPositions, tooltipData, colors) => {
            tooltipData.forEach((d, index) => {
                if (d) {
                    const tooltipId = `tooltip-${index}`;
                    let tooltip = d3.select(`#${tooltipId}`);

                    if (tooltip.empty()) {
                        tooltip = d3
                            .select('body')
                            .append('div')
                            .attr('id', tooltipId)
                            .attr('class', 'tooltip')
                            .style('position', 'absolute')
                            .style('padding', '5px')
                            .style('background', 'lightsteelblue')
                            .style('border', '0px')
                            .style('border-radius', '8px')
                            .style('pointer-events', 'none')
                            .style('font', '12px sans-serif')
                            .style('opacity', 0);
                    }

                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip
                        .html(
                            `<b>Year: </b><b style="color: ${colors(index)}">${
                                d.TIME_PERIOD
                            }</b><br/><b>Value: <b><b style="color: ${colors(index)}">${(+d.OBS_VALUE).toFixed(2)}</b>`,
                        )
                        .style('left', `${dotPositions[index].x + 20}px`)
                        .style('top', `${dotPositions[index].y - 10}px`);
                }
            });
        };

        const hideTooltips = () => {
            d3.selectAll('.tooltip').transition().duration(200).style('opacity', 0);
        };

        d3.csv('src/assets/data/combined_dataset.csv').then((data) => {
            const parseDate = d3.timeParse('%Y');

            const uniqueIndicators = [...new Set(data.map((d) => d.Indicator))];

            const x = d3
                .scaleTime()
                .domain(d3.extent(data, (d) => parseDate(d.TIME_PERIOD)))
                .range([margin.left, width - margin.right]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.Area === country && +d.OBS_VALUE)])
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

            const colors = d3.scaleOrdinal(d3.schemeCategory10);

            uniqueIndicators.forEach((indicator, index) => {
                const filteredData = data.filter((d) => d.Indicator === indicator && d.Area === country);

                svg.append('path')
                    .datum(filteredData)
                    .attr('fill', 'none')
                    .attr('stroke', colors(index))
                    .attr('stroke-width', 1.5)
                    .attr('d', line);

                // Add vertical lines
                svg.selectAll(`.vertical-line-${index}`)
                    .data(filteredData)
                    .enter()
                    .append('line')
                    .attr('class', `vertical-line-${index}`)
                    .attr('x1', (d) => x(parseDate(d.TIME_PERIOD)))
                    .attr('x2', (d) => x(parseDate(d.TIME_PERIOD)))
                    .attr('y1', margin.top)
                    .attr('y2', height - margin.bottom)
                    .attr('stroke', 'lightgray')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '4,4')
                    .style('opacity', 0); // Initially hidden

                // Add dots
                svg.selectAll(`.dot-${index}`)
                    .data(filteredData)
                    .enter()
                    .append('circle')
                    .attr('class', `dot-${index}`)
                    .attr('cx', (d) => x(parseDate(d.TIME_PERIOD)))
                    .attr('cy', (d) => y(+d.OBS_VALUE))
                    .attr('r', 5)
                    .attr('fill', colors(index))
                    .style('opacity', 0.8)
                    .on('mouseover', function (event, d) {
                        const year = d.TIME_PERIOD;
                        const hoveredDots = d3.selectAll('circle')
                            .filter((circleData) => circleData.TIME_PERIOD === year)
                            .attr('r', 6)
                            .attr('fill', 'orange')
                            .attr('stroke', 'black');
    
                        const tooltipData = uniqueIndicators.map((indicator) => {
                            const indicatorData = data.find(
                                (item) => item.Indicator === indicator && item.TIME_PERIOD === year && item.Area === country,
                            );
                            return indicatorData;
                        });
    
                        const dotPositions = hoveredDots.nodes().map((node) => {
                            const rect = node.getBoundingClientRect();
                            return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
                        });

                        showTooltips(dotPositions, tooltipData, colors);
                    
                        if (new Date(d.TIME_PERIOD).getFullYear() !== 2012) {
                            svg.selectAll(`.vertical-line-${index}`)
                                .filter((lineData) => lineData.TIME_PERIOD === year)
                                .style('opacity', 0.8);
                        }
                    })
                    .on('mouseout', function () {
                        const year = d3.select(this).datum().TIME_PERIOD;
                        d3.selectAll('circle')
                            .filter((circleData) => circleData.TIME_PERIOD === year)
                            .attr('r', 5)
                            .attr('fill', (circleData, circleIndex) => colors(circleIndex))
                            .attr('stroke', 'none');
    
                        hideTooltips();
    
                        svg.selectAll(`.vertical-line-${index}`).style('opacity', 0);
                    });
            });

            // Add legend
            const legend = svg
                .append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width - margin.right - 200}, ${margin.top - 120})`);

            uniqueIndicators.forEach((indicator, index) => {
                const legendRow = legend.append('g').attr('transform', `translate(0, ${index * 20})`);

                legendRow
                    .append('line')
                    .attr('x1', 0)
                    .attr('y1', 7)
                    .attr('x2', 20)
                    .attr('y2', 7)
                    .attr('stroke', colors(index))
                    .attr('stroke-width', 2);

                legendRow.append('text').attr('x', 25).attr('y', 10).text(indicator).attr('font-size', '12px');
            });
        });
    }, [country]);

    return (
        <div>
            <svg ref={svgRef} width={800} height={600}></svg>
        </div>
    );
};

export default TimeSeries;