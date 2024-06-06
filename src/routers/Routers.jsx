import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import MortalityInsightPage from '../pages/mortality-insight';
import CauseOfDeathPage from '../pages/cause-of-death';

const Routers = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mortality-insight" element={<MortalityInsightPage />} />
            <Route path="/cause-of-death" element={<CauseOfDeathPage />} />
        </Routes>
    );
};

export default Routers;
