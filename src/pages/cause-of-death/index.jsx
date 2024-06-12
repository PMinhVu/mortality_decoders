import PieChart from '@components/svgs/PieChart';
import styles from './index.module.scss';
import classNames from 'classnames/bind';
import LineChart from '@components/svgs/LineChart';

const cx = classNames.bind(styles);


const CauseOfDeathPage = () => {
    return (
        <div className={cx('container')}>
            <PieChart />
            <LineChart />
        </div>
    )
}

export default CauseOfDeathPage;