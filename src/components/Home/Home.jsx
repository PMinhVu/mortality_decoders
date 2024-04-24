import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import WorldData from '../../assets/data/world.js';

const cx = classNames.bind(styles);

const Indicators = [
    {
        id: 1,
        name: 'Under-five mortality rate',
    },
    {
        id: 2,
        name: 'Infant mortality rate',
    },
    {
        id: 3,
        name: 'Neonatal mortality rate',
    },
    {
        id: 4,
        name: 'Mortality rate 1-59 months',
    },
    {
        id: 5,
        name: 'Mortality rate age 1-11 months',
    },
    {
        id: 6,
        name: 'Child Mortality rate age 1-4',
    },
    {
        id: 7,
        name: 'Stillbirth rate',
    },
    {
        id: 8,
        name: 'Mortality rate age 5-14',
    },
    {
        id: 9,
        name: 'Mortality rate age 5-9',
    },
    {
        id: 10,
        name: 'Mortality rate age 10-14',
    },
    {
        id: 11,
        name: 'Mortality rate age 15-24',
    },
    {
        id: 12,
        name: 'Mortality rate age 15-19',
    },
    {
        id: 13,
        name: 'Mortality rate age 20-24',
    },
    {
        id: 14,
        name: 'Mortality rate age 5-24',
    },
    {
        id: 15,
        name: 'Mortality rate age 10-19',
    },
];

const Home = () => {
    const svgRef = useRef();
    const zoomRef = useRef();
    const [selectedIndicator, setSelectedIndicator] = useState(1);
    const [isMapChange, setIsMapChange] = useState(false);

    // Function to handle when pressing the Reset button
    const handleResetMap = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
        setIsMapChange(false);
    };

    useEffect(() => {
        // Width and height settings for the SVG
        const width = 1000;
        const height = 450;

        // Create SVG element and append it to ref'd div
        const svg = d3.select(svgRef.current).attr('viewBox', [0, 0, width, height]);

        // Create projection
        const projection = d3
            .geoMercator()
            .scale(130)
            .translate([width / 2, height / 2])
            .center([0, 0]);

        // Path generator
        const pathGenerator = d3.geoPath().projection(projection);

        // Delete old countries before redrawing the new map
        svg.selectAll('.country').remove();

        // Draw the map
        svg.selectAll('.country')
            .data(WorldData.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', pathGenerator)
            .attr('fill', '#ccc');

        // Creat zoom behavior
        const zoom = d3
            .zoom()
            .scaleExtent([1, 8])
            .on('start', () => {
                // This is to handle the scenario where user starts panning
                setIsMapChange(true);
            })
            .on('zoom', (event) => {
                svg.selectAll('.country').attr('transform', event.transform);
            })
            .on('end', (event) => {
                // Check if the transformation is not just the initial zoom state
                if (event.transform.k !== 1 || event.transform.x !== 0 || event.transform.y !== 0) {
                    setIsMapChange(true);
                } else {
                    setIsMapChange(false);
                }
            });

        // Apply zoom behavior for SVG
        svg.call(zoom);
        zoomRef.current = zoom;
    }, [selectedIndicator]);

    return (
        <div className={cx('container')}>
            <div className={cx('filtration')}>
                <div className={cx('indicator')}>
                    <p>Select indicator</p>
                    <select
                        name=""
                        id="indicator"
                        value={selectedIndicator}
                        onChange={(e) => setSelectedIndicator(parseInt(e.target.value))}
                    >
                        {Indicators.map((indicator) => (
                            <option key={indicator.id} value={indicator.id}>
                                {indicator.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={cx('country')}>
                    <p>Select country</p>
                    <select name="" id="country">
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Tanzania">Tanzania</option>
                    </select>
                </div>
            </div>
            <div className={cx('worldMap')}>
                <svg ref={svgRef} width={1000} height={500} />
                {isMapChange && (
                    <button className={cx('reset')} onClick={handleResetMap}>
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
};

export default Home;
