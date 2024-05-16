import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import MortalityInsightPage from '../pages/mortality-insight';

const Routers = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mortality-insight" element={<MortalityInsightPage />} />
        </Routes>
    );
};

export default Routers;
