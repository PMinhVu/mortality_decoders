import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import MortalityInsightPage from '../pages/morality-insight';

const Routers = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/morality-insight" element={<MortalityInsightPage />} />
        </Routes>
    );
};

export default Routers;
