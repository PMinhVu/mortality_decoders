import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const LineChart = () => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const width = 760,
        height = 500;
    const margin = { top: 50, right: 100, bottom: 100, left: 60 }; // Adjusted top margin for the title

    useEffect(() => {
        d3.csv('src/assets/data/CAUSE_OF_DEATH_IN_PERIOD_YEARS.csv')
            .then((parsedData) => {
                const formattedData = parsedData.map((d) => ({
                    cause: d.CAUSE_OF_DEATH,
                    year: +d.TIME_PERIOD,
                    deaths: +d.OBS_VALUE,
                }));
                setData(formattedData);
            })
            .catch((error) => {
                console.error('Error loading or parsing data:', error);
            });
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const svg = d3
            .select(ref.current)
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        svg.selectAll('*').remove(); // Clear SVG to prevent overlap

        const x = d3
            .scaleTime()
            .domain(d3.extent(data, (d) => d.year))
            .range([0, width - margin.left - margin.right]);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.deaths)])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const topCauses = Array.from(
            d3.group(data, (d) => d.cause),
            ([key, value]) => ({ key, total: d3.sum(value, (d) => d.deaths) }),
        )
            .sort((a, b) => b.total - a.total)
            .slice(0, 3)
            .map((d) => d.key);

        const dataFiltered = data.filter((d) => topCauses.includes(d.cause));

        const line = d3
            .line()
            .x((d) => x(d.year))
            .y((d) => y(d.deaths))
            .curve(d3.curveMonotoneX); // Smooth curve

        svg.append('g')
            .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(width / 80)
                    .tickFormat(d3.format('d'))
                    .tickSizeOuter(0),
            );

        svg.append('g').call(d3.axisLeft(y).ticks(10).tickFormat(d3.format('.0f')));

        const causeGroup = d3.group(dataFiltered, (d) => d.cause);

        causeGroup.forEach((values, cause) => {
            svg.append('path')
                .datum(values)
                .attr('fill', 'none')
                .attr('stroke', color(cause))
                .attr('stroke-width', 2)
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
        });

        svg.append('text')
            .attr('transform', `translate(${width - margin.left - 80},${height - margin.bottom - 45})`)
            .style('text-anchor', 'middle')
            .text('Year');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height - margin.top - margin.bottom) / 2)
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Number of Deaths');

        const legend = svg.append('g').attr('transform', `translate(0,${height - margin.top - margin.bottom + 40})`);

        topCauses.forEach((cause, i) => {
            const legendRow = legend.append('g').attr('transform', `translate(${i * 215}, 0)`);

            legendRow.append('rect').attr('width', 15).attr('height', 3).attr('y', 4).attr('fill', color(cause));

            legendRow
                .append('text')
                .attr('x', 20)
                .attr('y', 10)
                .attr('text-anchor', 'start')
                .attr('font-size', '12px')
                .style('text-transform', 'capitalize')
                .text(cause);
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

        const highlightCircle = svg
            .append('circle')
            .attr('r', 5)
            .attr('fill', 'red')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .style('opacity', 0);

        svg.append('rect')
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mousemove', mousemove)
            .on('mouseout', () => {
                tooltip.style('opacity', 0);
                highlightCircle.style('opacity', 0);
            });

        d3.bisector((d) => d.year).left;

        function mousemove(event) {
            const mouse = d3.pointer(event);

            let closestPoint = null;
            let minDistance = Infinity;

            dataFiltered.forEach((point) => {
                const distance = Math.sqrt(
                    Math.pow(x(point.year) - mouse[0], 2) + Math.pow(y(point.deaths) - mouse[1], 2),
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                }
            });

            if (closestPoint) {
                highlightCircle.attr('cx', x(closestPoint.year)).attr('cy', y(closestPoint.deaths)).style('opacity', 1);

                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip
                    .html(
                        `<strong>${closestPoint.cause}</strong><br/>Year: ${closestPoint.year}<br/>Deaths: ${closestPoint.deaths}`,
                    )
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`);
            }
        }

        // Add chart title
        svg.append('text')
            .attr('x', (width - margin.left - margin.right) / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '15px')
            .style('font-weight', 'bold')
            .text('Three lines of the highest proportion in causes of death');
    }, [data, margin.bottom, margin.left, margin.right, margin.top]);

    return (
        <div>
            <svg ref={ref}></svg>
        </div>
    );
};

export default LineChart;
