import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SphereWorldMap from '@components/svgs/3DWorldMap.jsx';
import PlainWorldMap from '@components/svgs/2DWorldMap.jsx';
import * as d3 from 'd3';

const cx = classNames.bind(styles);

const Indicators = [
    {
        id: 1,
        value: 'Neonatal mortality rate',
    },
    {
        id: 2,
        value: 'Mortality rate age 5-9',
    },
    {
        id: 3,
        value: 'Mortality rate age 10-14',
    },
    {
        id: 4,
        value: 'Mortality rate age 15-19',
    },
    {
        id: 5,
        value: 'Mortality rate age 20-24',
    },
];

const Years = [
    { id: 1, name: '2012', value: 2012.5 },
    { id: 2, name: '2013', value: 2013.5 },
    { id: 3, name: '2014', value: 2014.5 },
    { id: 4, name: '2015', value: 2015.5 },
    { id: 5, name: '2016', value: 2016.5 },
    { id: 6, name: '2017', value: 2017.5 },
    { id: 7, name: '2018', value: 2018.5 },
    { id: 8, name: '2019', value: 2019.5 },
    { id: 9, name: '2020', value: 2020.5 },
    { id: 10, name: '2021', value: 2021.5 },
    { id: 11, name: '2022', value: 2022.5 },
];

const Home = () => {
    const [selectedIndicator, setSelectedIndicator] = useState(Indicators[0].value);
    const [selectedYear, setSelectedYear] = useState(Years[0].value);
    const [mapType, setMapType] = useState('2D');
    const [country, setCountry] = useState('Afghanistan');
    const [countries, setCountries] = useState([]);

    const handleIndicatorChange = (event) => {
        setSelectedIndicator(event.target.value);
    };

    const handleYearChange = (event) => {
        setSelectedYear(parseFloat(event.target.value));
    };

    const handleMapTypeChange = (event) => {
        setMapType(event.target.value);
    };

    const handleCountryChange = (event) => {
        setCountry(event.target.value);
    };

    useEffect(() => {
        d3.json('src/assets/data/world.geojson').then((geojson) => {
            const uniqueCountries = Array.from(new Set(geojson.features.map((d) => d.properties.name)));
            setCountries(uniqueCountries);
        });
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('filtration')}>
                <div className={cx('indicator')}>
                    <h3>Select indicator</h3>
                    <select name="" id="indicator" value={selectedIndicator} onChange={handleIndicatorChange}>
                        {Indicators.map((indicator, index) => (
                            <option key={index} value={indicator.value}>
                                {indicator.value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={cx('year')}>
                    <h3>Select year</h3>
                    <select name="" id="year" value={selectedYear} onChange={handleYearChange}>
                        {Years.map((year, index) => (
                            <option key={index} value={year.value}>
                                {year.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={cx('mapType')}>
                    <h3>Select map type</h3>
                    <select name="" id="" onChange={handleMapTypeChange}>
                        <option value="2D">2D</option>
                        <option value="3D">3D</option>
                    </select>
                </div>
                <div className={cx('country')}>
                    <h3>Select Country</h3>
                    <select value={country} onChange={handleCountryChange}>
                        {countries.map((country) => (
                            <option key={country} value={country}>
                                {country}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                {mapType === '2D' ? (
                    <PlainWorldMap country={country} year={selectedYear} indicator={selectedIndicator} />
                ) : (
                    <SphereWorldMap country={country} year={selectedYear} indicator={selectedIndicator} />
                )}
            </div>
        </div>
    );
};

export default Home;
