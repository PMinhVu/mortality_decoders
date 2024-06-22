import { useEffect, useRef, useState } from 'react';
import VietNamCauseOfDeathData from '../../../assets/data/VietNam_Cause_Of_Death_Under_Five_2021.csv';
import * as d3 from 'd3';

const PieChart = () => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const width = 500,
        height = 400;
    const radius = Math.min(width, height) / 2.5;

    


    useEffect(() => {
        // Directly use the imported CSV data
        const formattedData = VietNamCauseOfDeathData.map((d) => ({
            label: d.CAUSE_OF_DEATH,
            value: parseFloat(d.PROPORTION.replace('%', '')),
        }))
        .filter((d) => d.label && !isNaN(d.value) && d.value >= 0);

        // Sort data by value in ascending order
        formattedData.sort((a, b) => a.value - b.value);

        setData(formattedData);
    }, []);

    useEffect(() => {
        if (data.length === 0) return;



        const svg = d3.select(ref.current).attr('width', width).attr('height', height);

        svg.selectAll('*').remove(); // Clear SVG to prevent overlap

        const chartGroup = svg.append('g').attr('transform', `translate(${width / 2},${height / 2 + 20})`);

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .text('Causes of death in Vietnamese Children Under Five in 2022');
        

        const colorScale = [
            '#7f7f7f',
            '#bcbd22',
            '#964b00',
            '#d62728',
            '#9467bd',
            '#e377c2',
            '#1f77b4',
            '#2ca02c',
            '#ff7f0e',
        ];

        const pie = d3
            .pie()
            .sort(null)
            .value((d) => d.value);

        const arc = d3
            .arc()
            .outerRadius(radius * 0.9)
            .innerRadius(radius * 0);

        const hoverArc = d3
            .arc()
            .outerRadius(radius)
            .innerRadius(radius * 0);

        const slices = chartGroup.append('g').attr('class', 'slices');

        slices
            .selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('class', 'slice')
            .attr('d', arc)
            .attr('fill', (d, i) => colorScale[i % colorScale.length])
            .on('mouseover', function (event, d) {
                d3.select(this).transition().duration(200).attr('d', hoverArc).style('opacity', 1);
                tooltip
                    .style('opacity', 1)
                    .style('left', `${event.clientX}px`)
                    .style('top', `${event.clientY}px`)
                    .html(`<b>${d.data.label}</b><br>Proportion: ${d.data.value.toFixed(2)}%`);
            })
            .on('mouseout', function () {
                d3.select(this).transition().duration(200).attr('d', arc).style('opacity', 0.7);
                tooltip.style('opacity', 0);
            })
            .style('opacity', 0.7)
            .transition()
            .duration(1000)
            .attrTween('d', function (d) {
                const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return arc(d);
                };
            });

        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '5px 10px')
            .style('border', '1px solid black')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('font-size', '12px');
    }, [data, radius, width, height]);

    return <svg ref={ref}></svg>;
};

export default PieChart;
