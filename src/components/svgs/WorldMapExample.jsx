import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const WorldMap = () => {
    const svgRef = useRef();

    useEffect(() => {
        // Define dimensions and create a projection
        const svg = d3.select(svgRef.current);
        const width = +svg.attr('width');
        const height = +svg.attr('height');
        const projection = d3
            .geoMercator()
            .scale(70)
            .center([0, 20])
            .translate([width / 2, height / 2]);
        const pathGenerator = d3.geoPath().projection(projection);

        // Define the color scale
        const colorScale = d3
            .scaleThreshold()
            .domain([40000, 100000, 1000000, 10000000, 50000000, 100000000, 1000000000])
            .range(d3.schemeBlues[6]);

        // Load data
        Promise.all([d3.json('src/assets/data/world.geojson'), d3.csv('src/assets/data/population_data.csv')]).then(
            ([topo, populationData]) => {
                const filteredPopulationData = populationData.filter((d) => d.Year === '2000');
                const populationById = new Map(filteredPopulationData.map((d) => [d.Code, +d.Population]));

                // create a tooltip element and hide it initially
                const tooltip = d3
                    .select('body')
                    .append('div')
                    .attr('id', 'tooltip')
                    .style('position', 'absolute')
                    .style('text-align', 'center')
                    .style('width', 'auto')
                    .style('padding', '5px')
                    .style('font', '12px sans-serif')
                    .style('background', 'lightsteelblue')
                    .style('border', '0px')
                    .style('border-radius', '8px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                // Draw the map
                svg.append('g')
                    .selectAll('path')
                    .data(topo.features)
                    .enter()
                    .append('path')
                    .attr('d', pathGenerator)
                    .attr('fill', (d) => {
                        const pop = populationById.get(d.id) || 0;
                        return colorScale(pop);
                    })
                    .style('stroke', 'transparent')
                    .style('opacity', 0.8)
                    // add event handlers for mouseover and mouseout events
                    .on('mouseover', function (event, d) {
                        const pop = populationById.get(d.id) || 0;
                        d3.select(this).style('stroke', 'black').raise(); // This brings the element to the top

                        tooltip
                            .style('left', event.pageX + 10 + 'px')
                            .style('top', event.pageY + 10 + 'px')
                            .html(
                                `Country: <strong>${d.properties.name}</strong><br/>Population: ${pop.toLocaleString()}`,
                            )
                            .transition()
                            .duration(200)
                            .style('opacity', 1);
                    })
                    .on('mouseout', function () {
                        d3.select(this).style('stroke', 'transparent');

                        tooltip.transition().duration(200).style('opacity', 0);
                    });
            },
        );
    }, []);

    return <svg ref={svgRef} width={800} height={450}></svg>;
};

export default WorldMap;
