// Layout.jsx
import { BrowserRouter as Router } from 'react-router-dom';
import Header from '../components/Header/Header';
import Routers from '../routers/Routers';

const Layout = () => {
    return (
        <div>
            <Router>
                <Header />
                <main>
                    <Routers />
                </main>
            </Router>
        </div>
    );
};

export default Layout;
