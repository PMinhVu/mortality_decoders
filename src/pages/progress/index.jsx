import styles from './index.module.scss';
import classNames from 'classnames/bind';
import ProgressBarChart from '@components/svgs/ProgressBarChart'
import MortalityComparisonBarChart from '@components/svgs/MortalityComparisonBarChart'

const cx = classNames.bind(styles);


const ProgressPage = () => {
    return (
        <div className={cx('container')}>
            <ProgressBarChart />
            <MortalityComparisonBarChart />
        </div>
    )
}

export default ProgressPage;
