// Layout.jsx
import { BrowserRouter as Router } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Routers from '../routers/Routers';

const Layout = () => {
    return (
        <Router>
            <div>
                <Sidebar />
                <main>
                    <Routers />
                </main>
            </div>
        </Router>
    );
};

export default Layout;
