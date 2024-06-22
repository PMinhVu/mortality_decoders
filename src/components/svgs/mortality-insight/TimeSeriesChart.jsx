import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import VietNam33YearsData from '../../../assets/data/VietNam_33years.csv';

const TimeSeriesChart = () => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 550;
        const height = 550;
        const margin = { top: 50, right: 30, bottom: 70, left: 50 };

        const showTooltips = (dotPositions, tooltipData, colors) => {
            const tooltipHeight = 20;
            const tooltipMargin = 5;

            tooltipData.forEach((d, index) => {
                if (d) {
                    const tooltipId = `tooltip-${index}`;
                    let tooltip = d3.select(`#${tooltipId}`);

                    if (tooltip.empty()) {
                        tooltip = d3
                            .select(svgRef.current.parentNode)
                            .append('div')
                            .attr('id', tooltipId)
                            .attr('class', 'tooltip')
                            .style('position', 'absolute')
                            .style('padding', '5px')
                            .style('background', 'rgba(0, 0, 0, 0.8)')
                            .style('color', '#fff')
                            .style('border-radius', '4px')
                            .style('pointer-events', 'none')
                            .style('font', '12px sans-serif')
                            .style('opacity', 0);
                    }

                    tooltip.transition().duration(100).style('opacity', 0.9);
                    tooltip
                        .html(
                            `<b>Year: </b><b style="color: ${colors(index)}">${
                                d.TIME_PERIOD.split('-')[0]
                            } </b><b>Value: <b><b style="color: ${colors(index)}">${(+d.OBS_VALUE).toFixed(2)}</b>`,
                        )
                        .style('left', `${dotPositions[index].x + 10}px`)
                        .style('top', `${dotPositions[index].y - tooltipHeight * index - tooltipMargin * index}px`)
                        .style('transform', 'translateX(-50%)')
                        .style('width', 'auto')
                        .style('height', 'auto')
                        .style('white-space', 'nowrap');
                }
            });
        };

        const hideTooltips = () => {
            d3.selectAll('.tooltip').transition().duration(100).style('opacity', 0).remove();
        };

        // Assuming VietNam33YearsData is already parsed as an array of objects
        const data = VietNam33YearsData;

        const parseDate = d3.timeParse('%Y-%m');

        // Define the order of indicators
        const indicatorOrder = [
            'Neonatal mortality rate',
            'Child Mortality rate age 1-4',
            'Mortality rate age 5-9',
            'Mortality rate age 10-14',
            'Mortality rate age 15-19',
        ];

        const x = d3
            .scaleTime()
            .domain([new Date(1990, 0, 1), new Date(2022, 11, 31)])
            .range([margin.left - 5, width - margin.right]);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d['Geographic area'] === 'Viet Nam' && +d.OBS_VALUE)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const xAxis = (g) =>
            g
                .attr('transform', `translate(5,${height - margin.bottom})`)
                .call(
                    d3
                        .axisBottom(x)
                        .ticks(d3.timeYear.every(5))
                        .tickFormat(d3.timeFormat('%Y'))
                        .tickSizeOuter(0),
                );

        const yAxis = (g) => g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        const line = d3
            .line()
            .x((d) => x(parseDate(d.TIME_PERIOD)))
            .y((d) => y(+d.OBS_VALUE))
            .curve(d3.curveMonotoneX); // Smooth curve

        const colors = d3.scaleOrdinal(d3.schemeCategory10);

        indicatorOrder.forEach((indicator, index) => {
            const filteredData = data.filter(
                (d) => d.Indicator === indicator && d['Geographic area'] === 'Viet Nam',
            );

            svg.append('path')
                .datum(filteredData)
                .attr('fill', 'none')
                .attr('stroke', colors(index))
                .attr('stroke-width', 1.5)
                .attr('d', line)
                .attr('stroke-dasharray', function () {
                    return this.getTotalLength();
                })
                .attr('stroke-dashoffset', function () {
                    return this.getTotalLength();
                })
                .transition()
                .duration(2000)
                .attr('stroke-dashoffset', 0);

            svg.selectAll(`.vertical-line-${index}`)
                .data(filteredData)
                .enter()
                .append('line')
                .attr('class', `vertical-line-${index}`)
                .attr('x1', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('x2', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('y1', margin.top)
                .attr('y2', height - margin.bottom)
                .attr('stroke', 'rgba(0, 0, 0, 0.1)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '2,2')
                .style('opacity', 0);

            svg.selectAll(`.dot-${index}`)
                .data(filteredData)
                .enter()
                .append('circle')
                .attr('class', `dot-${index}`)
                .attr('cx', (d) => x(parseDate(d.TIME_PERIOD)))
                .attr('cy', (d) => y(+d.OBS_VALUE))
                .attr('r', 4)
                .attr('fill', colors(index))
                .style('opacity', 0)
                .on('mouseover', function (event, d) {
                    const year = d.TIME_PERIOD;
                    const hoveredDots = d3
                        .selectAll('circle')
                        .filter((circleData) => circleData.TIME_PERIOD === year)
                        .attr('r', 6)
                        .attr('fill', colors(index))
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2)
                        .style('opacity', 1);

                    const tooltipData = indicatorOrder.map((indicator) => {
                        const indicatorData = data.find(
                            (item) =>
                                item.Indicator === indicator &&
                                item.TIME_PERIOD === year &&
                                item['Geographic area'] === 'Viet Nam',
                        );
                        return indicatorData;
                    });

                    const dotPositions = hoveredDots.nodes().map((node) => {
                        const rect = node.getBoundingClientRect();
                        return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
                    });

                    showTooltips(dotPositions, tooltipData, colors);

                    svg.selectAll(`.vertical-line-${index}`)
                        .filter((lineData) => lineData.TIME_PERIOD === year)
                        .style('opacity', 0.8);
                })
                .on('mouseout', function () {
                    const year = d3.select(this).datum().TIME_PERIOD;
                    d3.selectAll('circle')
                        .filter((circleData) => circleData.TIME_PERIOD === year)
                        .attr('r', 4)
                        .attr('fill', (circleData, circleIndex) => colors(circleIndex))
                        .attr('stroke', 'none')
                        .style('opacity', 0);

                    hideTooltips();

                    svg.selectAll(`.vertical-line-${index}`).style('opacity', 0);
                });
        });

        const legend = svg
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - margin.right - 180}, ${margin.top})`);

        indicatorOrder.forEach((indicator, index) => {
            const legendRow = legend.append('g').attr('transform', `translate(0, ${index * 20})`);

            legendRow
                .append('line')
                .attr('x1', 0)
                .attr('y1', 7)
                .attr('x2', 20)
                .attr('y2', 7)
                .attr('stroke', colors(index))
                .attr('stroke-width', 2);

            legendRow.append('text').attr('x', 25).attr('y', 10).text(indicator).attr('font-size', '10px');
        });

        // Add x-axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 35)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text('Year');

        // Add y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', margin.left / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text('Values');

        svg
            .append('text')
            .attr('x', width / 2.25)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text(`Trends in Age-Specific Child Mortality Rates in Vietnam (1990-2022)`);
    }, []);

    return (
        <div>
            <svg ref={svgRef} width={550} height={550}></svg>
        </div>
    );
};

export default TimeSeriesChart;
