import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../../GlobalStyle.css';
import { CiZoomIn, CiZoomOut } from 'react-icons/ci';
import { LuRotate3D, LuPauseCircle } from 'react-icons/lu';

// eslint-disable-next-line react/prop-types
const SphereWorldMap = ({ country, year, indicator }) => {
    const svgRef = useRef();
    const zoomRef = useRef();
    const [isToggleRotating, setIsToggleRotating] = useState(false);
    const rotationTimerRef = useRef();
    const sensitivity = 200;

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = 800;
        const height = 550;
        let isRotating = false;

        svg.attr('width', width).attr('height', height);

        // Projection and path generator setup
        const projection = d3
            .geoOrthographic()
            .scale(250)
            .center([0, 0])
            .rotate([0, -30])
            .translate([width / 1.8, height / 2]);
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
            .attr('cx', width / 1.8)
            .attr('cy', height / 2)
            .attr('r', projection.scale());

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
                            const rotate = projection.rotate();
                            const k = sensitivity / projection.scale();
                            const newRotation = [rotate[0] + event.dx * k, rotate[1] - event.dy * k];
                            projection.rotate(newRotation);
                            svg.selectAll('path').attr('d', pathGenerator);
                        }),
                    );

                // Function to zoom to a specific country
                const zoomToCountry = (countryName) => {
                    const selectedCountry = topo.features.find((d) => d.properties.name === countryName);
                    if (selectedCountry) {
                        // Calculate the centroid of the selected country feature
                        const centroid = d3.geoCentroid(selectedCountry);
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
                                const bounds = pathGenerator.bounds(selectedCountry);
                                const dx = bounds[1][0] - bounds[0][0];
                                const dy = bounds[1][1] - bounds[0][1];
                                const x = (bounds[0][0] + bounds[1][0]) / 2;
                                const y = (bounds[0][1] + bounds[1][1]) / 2;
                                const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
                                const translate = [width / 1.8 - scale * x, height / 2 - scale * y];

                                svg.transition()
                                    .duration(750)
                                    .call(
                                        zoom.transform,
                                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale),
                                    );
                                if (rotationTimerRef.current) {
                                    rotationTimerRef.current.stop();
                                }
                                // setIsRotating(false);
                                isRotating = false;
                            });
                    }
                };

                // Attach zoom to Vietnam functionality
                d3.select('#zoom-to-vietnam').on('click', () => {
                    zoomToCountry('VietNam');
                });

                // Attach zoom to selected country functionality
                d3.select('#zoom-to-selected-country').on('click', () => {
                    zoomToCountry(country);
                });

                // Automatic rotation functionality
                d3.select('#automatic-to-rotate').on('click', () => {
                    if (!isRotating) {
                        rotationTimerRef.current = d3.timer(function () {
                            const rotate = projection.rotate();
                            const k = sensitivity / projection.scale();
                            projection.rotate([rotate[0] - 1 * k, rotate[1]]);
                            svg.selectAll('path').attr('d', pathGenerator);
                        }, 200);
                        // setIsRotating(true);
                        isRotating = true;
                    } else {
                        if (rotationTimerRef.current) {
                            rotationTimerRef.current.stop();
                        }
                        // setIsRotating(false);
                        isRotating = false;
                    }
                });

                // Reset zoom button
                d3.select('#reset-zoom').on('click', () => {
                    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
                });

                // Legend setup
                const legendItemSize = 20;
                const legendSpacing = 4; // Space between items
                const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(20, 20)');

                legend
                    .append('rect')
                    .attr('x', -10)
                    .attr('y', -10)
                    .attr('width', 100)
                    .attr('height', colorScale.range().length * (legendItemSize + legendSpacing) + 20) // Dynamic height calculation
                    .attr('fill', 'white')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('rx', 5)
                    .attr('ry', 5);

                // Adding legend items
                colorScale.range().forEach((color, index) => {
                    const legendItem = legend
                        .append('g')
                        .attr('transform', `translate(0, ${index * (legendItemSize + legendSpacing)})`);

                    legendItem
                        .append('rect')
                        .attr('width', legendItemSize)
                        .attr('height', legendItemSize)
                        .attr('fill', color);

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
            },
        );
    }, [year, indicator, country]); // Dependency array to re-run effect on change

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            <div style={{ border: '2px solid #000', borderRadius: '10px' }}>
                <svg ref={svgRef}></svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
                <button
                    id="zoom-to-vietnam"
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                >
                    <CiZoomIn style={{ fontSize: '18px' }} />
                    Zoom to Vietnam
                </button>
                <button
                    id="zoom-to-selected-country"
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                >
                    <CiZoomIn style={{ fontSize: '18px' }} />
                    Zoom to {country}
                </button>

                {!isToggleRotating ? (
                    <button
                        id="automatic-to-rotate"
                        onClick={() => setIsToggleRotating(true)}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                    >
                        <LuRotate3D style={{ fontSize: '18px' }} />
                        Rotate
                    </button>
                ) : (
                    <button
                        onClick={() => setIsToggleRotating(false)}
                        id="automatic-to-rotate"
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                    >
                        <LuPauseCircle style={{ fontSize: '18px' }} />
                        Pause
                    </button>
                )}

                <button
                    id="reset-zoom"
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                >
                    <CiZoomOut style={{ fontSize: '18px' }} />
                    Reset Zoom
                </button>
            </div>
            <div id="tooltip" style={{ position: 'absolute', opacity: 0 }}></div>
        </div>
    );
};

export default SphereWorldMap;
