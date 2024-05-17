import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import TimeSeries from '@components/svgs/TimeSeriesChart';
import * as d3 from 'd3';
import BarChart from '@components/svgs/BarChart';

const cx = classNames.bind(styles);



const MortalityInsightPage = () => {
    const [country, setCountry] = useState('Afghanistan');
    const [countries, setCountries] = useState([]);


    const handleCountryChange = (event) =>{
        setCountry(event.target.value);
    }

    useEffect(() => {
        d3.csv('src/assets/data/combined_dataset.csv').then((data) => {
            const uniqueCountries = Array.from(new Set(data.map(d => d.Area)));
            const sortedCountries = uniqueCountries.sort((a, b) => a.localeCompare(b));
            setCountries(sortedCountries);
          });
    }, []);


    return (
        <div className={cx('container')}>
            <div className={cx('filtration')}>
                <div className={cx('country')}>
                    <h3>Select country</h3>
                    <select value={country} onChange={handleCountryChange}>
                        {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <TimeSeries country={country} />
                {/* <BarChart indicator={selectedIndicator} country={country} /> */}
            </div>
        </div>
    );
};

export default MortalityInsightPage;
