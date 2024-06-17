import styles from './index.module.scss';
import classNames from 'classnames/bind';
import BarChart from '@components/svgs/progress/BarChart'
import CustomBarChart from '@components/svgs/progress/CustomBarChart'

const cx = classNames.bind(styles);


const ProgressPage = () => {
    return (
        <div className={cx('container')}>
            <BarChart />
            <CustomBarChart />
        </div>
    )
}

export default ProgressPage;
