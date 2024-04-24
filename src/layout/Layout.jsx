// Layout.jsx
import { BrowserRouter as Router } from 'react-router-dom';
import Header from '../components/Header/Header';
import Routers from '../routers/Routers';

const Layout = () => {
    return (
        <Router>
            <div>
                <Header />
                <main>
                    <Routers />
                </main>
            </div>
        </Router>
    );
};

export default Layout;
