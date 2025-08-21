import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import trophy from '../assets/trophy.ico'
import { UserContext } from './UserContext'
import { supabase } from '../supabaseClient'


function Navbar() {
    const { user, setUser } = useContext(UserContext);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.reload(); // veya navigate("/onlineGiris") ile giriş sayfasına yönlendirebilirsin
    };

    return (
        <div>
            <div className="navbar">
                <Link to="/" className='navbar-link'>
                    <img src={trophy} alt="" style={{ marginRight: '20px' }} /> Turnuva Ana Sayfası
                </Link>
                <Link to="/onlineGiris" className="navbar-link">Online Giriş Sistemi</Link>
                <Link to="/my-tournaments" className="navbar-link">Geçmiş Turnuvalarım</Link>
            </div>
        </div>
    )
}

export default Navbar