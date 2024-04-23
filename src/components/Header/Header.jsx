import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';

const cx = classNames.bind(styles);

const navLinks = [
    {
        path: '/',
        content: 'Home',
    },
    {
        path: '/more',
        content: 'More',
    },
];

const Header = () => {
    const [activeLink, setActiveLink] = useState(null);
    const location = useLocation();
    const isActive = (path) => {
        return location.pathname === path || (location.pathname === '/' && path === '/home');
    };

    const handleNavLinkClick = (index) => {
        setActiveLink(index);
    };

    return (
        <div className={cx('container')}>
            {navLinks.map((link, index) => (
                <li key={index}>
                    <NavLink
                        to={link.path}
                        className={cx('link', { active: isActive(link.path) })}
                        onClick={() => handleNavLinkClick(index)}
                    >
                        {link.content}
                    </NavLink>
                </li>
            ))}
        </div>
    );
};

export default Header;
