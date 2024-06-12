import styles from './index.module.scss';
import classNames from 'classnames/bind';
import ProgressBarChart from '@components/svgs/ProgressBarChart'

const cx = classNames.bind(styles);


const ProgressPage = () => {
    return (
        <div className={cx('container')}>
            <ProgressBarChart />
        </div>
    )
}

export default ProgressPage;