import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// eslint-disable-next-line react/prop-types
const SphereWorldMap = ({ year, indicator }) => {
    const svgRef = useRef();
    const zoomRef = useRef();
    const [isRotating, setIsRotating] = useState(false);
    const rotationTimerRef = useRef(null);
    const sensitivity = 75;

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = 800;
        const height = 500;
        svg.attr('width', width).attr('height', height);

        // Projection and path generator setup
        const projection = d3
            .geoOrthographic()
            .scale(250)
            .center([0, 0])
            .rotate([0, -30])
            .translate([width / 2, height / 2]);
        const pathGenerator = d3.geoPath().projection(projection);

        // Define zoom behavior
        const zoom = d3
            .zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                svg.selectAll('path').attr('transform', event.transform);
            });
        zoomRef.current = zoom;
        svg.call(zoom);

        // Define the color scale
        const colorScale = d3
            .scaleThreshold()
            .domain([0.1, 0.5, 1.5, 3.5, 5, 8, 10, 30])
            .range(['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594', '#08306b']);

        const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(20, 20)'); // Adjust position to fit your layout
        const legendItemSize = 20; // Height and width of the legend item
        const legendSpacing = 4; // Space between items

        colorScale.range().forEach((color, index) => {
            const legendItem = legend
                .append('g')
                .attr('transform', `translate(0, ${index * (legendItemSize + legendSpacing)})`);

            legendItem.append('rect').attr('width', legendItemSize).attr('height', legendItemSize).attr('fill', color);

            legendItem
                .append('text')
                .attr('x', legendItemSize + 5) // Space text a bit from the rectangle
                .attr('y', legendItemSize - legendSpacing) // Adjust text position to be more centered
                .text(() => {
                    if (index === 0) return `< ${colorScale.domain()[0]}`;
                    if (index === colorScale.range().length - 1) return `≥ ${colorScale.domain()[index - 1]}`;
                    return `${colorScale.domain()[index - 1]} - ${colorScale.domain()[index]}`;
                });
        });

        // Append the definitions to your SVG
        let defs = svg.append('defs');

        // Create a radial gradient
        let gradient = defs
            .append('radialGradient')
            .attr('id', 'globeGradient')
            .attr('cx', '50%') // The x-center of the gradient
            .attr('cy', '50%') // The y-center of the gradient
            .attr('r', '50%'); // The radius of the gradient

        // Define the colors for the gradient
        gradient
            .append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ADD8E6') // Lighter blue at the center
            .attr('stop-opacity', 1);

        gradient
            .append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#ebfafc') // Darker blue towards the edges
            .attr('stop-opacity', 1);

        // Add the globe with gradient fill
        svg.append('circle')
            .attr('fill', 'url(#globeGradient)') // Use the gradient
            .attr('stroke', '#000')
            .attr('stroke-width', '0.2')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .select('#zoom-to-vietnam');

        // Load and process data
        Promise.all([d3.json('src/assets/data/world.geojson'), d3.csv('src/assets/data/combined_dataset.csv')]).then(
            ([topo, moralityData]) => {
                const filteredMoralityData = moralityData.filter(
                    (d) => +d.REF_DATE === year && d.Indicator === indicator,
                );
                const moralityByArea = new Map(
                    filteredMoralityData.map((d) => [
                        d.Area,
                        { obsValue: +d.OBS_VALUE, lowerBound: +d.LOWER_BOUND, upperBound: +d.UPPER_BOUND },
                    ]),
                );

                // Draw the map
                svg.selectAll('.country').remove();
                svg.append('g')
                    .attr('class', 'country')
                    .selectAll('path')
                    .data(topo.features)
                    .enter()
                    .append('path')
                    .attr('d', pathGenerator)
                    .attr('fill', (d) => {
                        const data = moralityByArea.get(d.properties.name);
                        return colorScale(data ? data.obsValue : 0);
                    })
                    .style('stroke', 'white')
                    .style('opacity', 0.8)
                    .on('mouseover', function (event, d) {
                        d3.select(this).style('stroke', 'black').raise(); // Highlight and bring to front
                        // Tooltip setup
                        const data = moralityByArea.get(d.properties.name) || {
                            obsValue: 0,
                            lowerBound: 0,
                            upperBound: 0,
                        };
                        const tooltipHtml = `Country: <strong>${
                            d.properties.name
                        }</strong><br/>UN IGME estimate: ${data.obsValue.toLocaleString()}<br/>Uncertainty interval: (${data.lowerBound.toFixed(
                            2,
                        )}-${data.upperBound.toFixed(2)})`;
                        d3.select('#tooltip')
                            .html(tooltipHtml)
                            .style('padding', '5px')
                            .style('background', 'lightsteelblue')
                            .style('border', '0px')
                            .style('border-radius', '8px')
                            .style('font', '12px sans-serif')
                            .style('left', `${event.pageX + 10}px`)
                            .style('top', `${event.pageY + 10}px`)
                            .style('opacity', 1);
                    })
                    .on('mouseout', function () {
                        d3.select(this).style('stroke', 'white');
                        d3.select('#tooltip').style('opacity', 0);
                    })

                    .call(
                        d3.drag().on('drag', (event) => {
                            console.log('Dragging', event.dx, event.dy); // Check the values being received
                            const rotate = projection.rotate();
                            const k = sensitivity / projection.scale();
                            const newRotation = [rotate[0] + event.dx * k, rotate[1] - event.dy * k];
                            projection.rotate(newRotation);
                            svg.selectAll('path').attr('d', pathGenerator);
                        }),
                    );

                // Zoom to Vietnam functionality
                d3.select('#zoom-to-vietnam').on('click', () => {
                    const vietnam = topo.features.find((d) => d.properties.name === 'VietNam');
                    if (vietnam) {
                        // Calculate the centroid of the Vietnam feature
                        const centroid = d3.geoCentroid(vietnam);
                        // Calculate the rotation needed to center the projection on the centroid
                        const rotate = projection.rotate();
                        const newRotation = [-centroid[0], -centroid[1]];

                        // Start the rotation and zoom transition
                        svg.transition()
                            .duration(750)
                            .tween('rotate', () => {
                                const r = d3.interpolate(rotate, newRotation);
                                return (t) => {
                                    projection.rotate(r(t));
                                    svg.selectAll('path').attr('d', pathGenerator);
                                };
                            })
                            .on('end', () => {
                                // Once rotation is finished, calculate the bounds and apply the zoom
                                const bounds = pathGenerator.bounds(vietnam);
                                const dx = bounds[1][0] - bounds[0][0];
                                const dy = bounds[1][1] - bounds[0][1];
                                const x = (bounds[0][0] + bounds[1][0]) / 2;
                                const y = (bounds[0][1] + bounds[1][1]) / 2;
                                const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
                                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                                svg.transition()
                                    .duration(750)
                                    .call(
                                        zoom.transform,
                                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale),
                                    );
                                rotationTimerRef.current.stop();
                                setIsRotating(false);
                            });
                    }
                });

                d3.select('#automatic-to-rotate').on('click', () => {
                    if (!isRotating) {
                        rotationTimerRef.current = d3.timer(function () {
                            const rotate = projection.rotate();
                            const k = sensitivity / projection.scale();
                            projection.rotate([rotate[0] - 1 * k, rotate[1]]);
                            svg.selectAll('path').attr('d', pathGenerator);
                        }, 200);
                        setIsRotating(true);
                    } else {
                        rotationTimerRef.current.stop();
                        setIsRotating(false);
                    }
                });

                // Reset zoom button
                d3.select('#reset-zoom').on('click', () => {
                    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
                });
            },
        );
    }, [year, indicator, isRotating]); // Dependency array to re-run effect on change

    return (
        <>
            <svg ref={svgRef}></svg>
            <button id="zoom-to-vietnam">Zoom to Vietnam</button>
            <button id="automatic-to-rotate"> {!isRotating ? ' Rotate ' : ' Pause '} </button>
            <button id="reset-zoom">Reset Zoom</button>
            <div id="tooltip" style={{ position: 'absolute', opacity: 0 }}></div>
        </>
    );
};

export default SphereWorldMap;
