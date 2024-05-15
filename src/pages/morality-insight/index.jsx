import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import TimeSeries from '@components/svgs/TimeSeriesChart';
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


const MortalityInsightPage = () => {
    const [selectedIndicator, setSelectedIndicator] = useState(Indicators[0].value);
    const [country, setCountry] = useState('Afghanistan');
    const [countries, setCountries] = useState([]);

    const handleIndicatorChange = (event) => {
        setSelectedIndicator(event.target.value);
    };

    const handleCountryChange = (event) =>{
        setCountry(event.target.value);
    }

    useEffect(() => {
        d3.csv('src/assets/data/combined_dataset.csv').then((data) => {
            const uniqueCountries = Array.from(new Set(data.map(d => d.Area)));
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
                <div className={cx('country')}>
                    <h3>Select Country</h3>
                    <select value={country} onChange={handleCountryChange}>
                        {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <TimeSeries indicator={selectedIndicator} country={country} />
            </div>
        </div>
    );
};

export default MortalityInsightPage;
