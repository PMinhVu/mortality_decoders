import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import MortalityInsightPage from '../pages/mortality-insight';
import CauseOfDeathPage from '../pages/cause-of-death';
import ProgressPage from '@pages/progress';

const Routers = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mortality-insight" element={<MortalityInsightPage />} />
            <Route path="/cause-of-death" element={<CauseOfDeathPage />} />
            <Route path="/progress" element={<ProgressPage />} />
        </Routes>
    );
};

export default Routers;
