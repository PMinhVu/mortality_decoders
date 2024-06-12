import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const PieChart = () => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const width = 960, height = 400;
    const radius = Math.min(width, height) / 2;

    useEffect(() => {
        d3.csv('src/assets/data/VIETNAM_CAUSE_OF_DEATH_UNDER_FIVE_2021.csv').then(parsedData => {
            const newData = parsedData.filter(d => 
                d.CAUSE_OF_DEATH && d.PROPORTION
            ).map(d => {
                const value = parseFloat(d.PROPORTION.replace('%', ''));
                return {
                    label: d.CAUSE_OF_DEATH,
                    value: isNaN(value) ? 0 : value
                };
            }).filter(d => d.value >= 0);
    
            setData(newData);
        }).catch(error => {
            console.error('Error loading or parsing data:', error);
        });
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const svg = d3.select(ref.current)
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        svg.selectAll('*').remove(); // Clear SVG to prevent overlap

        // Define a colorful gradient for each slice
        const defs = svg.append('defs');
        data.forEach((d, i) => {
            const gradient = defs.append('linearGradient')
                .attr('id', `gradient${i}`)
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%'); // Horizontal gradient

            // Calculating indices for color stops to increase visibility
            const colorStart = i / data.length;

            gradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', d3.interpolateRainbow(colorStart)); // Ensuring colors start from a visible range

        });


        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .outerRadius(radius * 0.9)
            .innerRadius(radius * 0);

        const hoverArc = d3.arc()
            .outerRadius(radius)
            .innerRadius(radius * 0);

        const slices = svg.append('g').attr('class', 'slices');

        slices.selectAll('path')
            .data(pie(data))
            .enter().append('path')
            .attr('class', 'slice')
            .attr('d', arc)
            .attr('fill', (d, i) => `url(#gradient${i})`)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', hoverArc)
                    .style('opacity', 1);
                showTooltip(event, d);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc)
                    .style('opacity', 0.7);
                hideTooltip();
            })
            .style('opacity', 0.7);

        function showTooltip(event, d) {
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('left', `${event.clientX}px`)
                .style('top', `${event.clientY}px`)
                .style('background', 'white')
                .style('padding', '5px 10px')
                .style('border', '1px solid black')
                .style('border-radius', '5px')
                .style('pointer-events', 'none')
                .html(`${d.data.label}: <b>${d.data.value.toFixed(2)}%</b>`);

            const bbox = tooltip.node().getBoundingClientRect();
            tooltip.style('left', `${event.clientX - bbox.width}px`)
                   .style('top', `${event.clientY - bbox.height - 10}px`);
        }

        function hideTooltip() {
            d3.select('.tooltip').remove();
        }
    }, [data, radius, width, height]);

    return <svg ref={ref}></svg>;
};

export default PieChart;
