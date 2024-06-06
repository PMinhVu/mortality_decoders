import PieChart from '@components/svgs/PieChart';
import styles from './index.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);


const CauseOfDeathPage = () => {
    return (
        <div className={cx('container')}>
            <PieChart />
        </div>
    )
}

export default CauseOfDeathPage;