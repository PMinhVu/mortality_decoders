import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// eslint-disable-next-line react/prop-types
const IndicatorDistributionBarGraph = ({ country }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear the previous data content

        const width = 800;
        const height = 550;
        const margin = { top: 50, right: 30, bottom: 100, left: 60 };

        d3.csv('src/assets/data/combined_dataset.csv').then((data) => {
            // Filter data for the selected country
            const countryData = data.filter((d) => d.Area === country);

            // Find the latest year
            const latestYear = d3.max(countryData, (d) => +d.TIME_PERIOD);

            // Filter data for the latest year
            const latestYearData = countryData.filter((d) => +d.TIME_PERIOD === latestYear);

            // Group data by indicators
            const indicatorData = d3.rollup(
                latestYearData,
                (v) => d3.sum(v, (d) => +d.OBS_VALUE),
                (d) => d.Indicator,
            );

            // Prepare data for plotting
            const indicators = Array.from(indicatorData.keys());
            const values = Array.from(indicatorData.values());

            // Set up scales
            const x = d3.scaleBand().domain(indicators).range([margin.left, width - margin.right]).padding(0.3);
            const y = d3.scaleLinear().domain([0, d3.max(values)]).nice().range([height - margin.bottom, margin.top]);

            // Add x-axis
            svg.append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll('text')
                .attr('y', 15)
                .style('font-size', "12px")
                .style('text-anchor', 'middle');

            // Add y-axis
            svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

                        // Add bars with gradient fill
                        const gradient = svg
                        .append('defs')
                        .append('linearGradient')
                        .attr('id', 'barGradient')
                        .attr('gradientTransform', 'rotate(90)');
        
                    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4e79a7');
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#f28e2c');
        
                    svg.selectAll('.bar')
                        .data(indicators)
                        .enter()
                        .append('rect')
                        .attr('class', 'bar')
                        .attr('x', (d) => x(d))
                        .attr('y', (d) => y(indicatorData.get(d)))
                        .attr('width', x.bandwidth())
                        .attr('height', (d) => height - margin.bottom - y(indicatorData.get(d)))
                        .attr('fill', 'url(#barGradient)');
        
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
                                .attr('fill', '#4e79a7')
                                .attr('opacity', 0.8);
                        });
        
                    // Add chart title
                    svg.append('text')
                        .attr('x', width / 2)
                        .attr('y', margin.top / 2)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '20px')
                        .attr('font-weight', 'bold')
                        .text(`Indicator Distribution for ${country} in ${latestYear}`);
        });
    }, [country]);

    return (
        <div>
            <svg ref={svgRef} width={800} height={600}></svg>
        </div>
    );
};

export default IndicatorDistributionBarGraph;