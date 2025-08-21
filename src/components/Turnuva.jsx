import React, { useContext } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

import image from '../assets/resimler/eleme.jpg';
import lig from '../assets/resimler/lig.jpg';
import grup from '../assets/resimler/grup.jpg';
import { UserContext } from './UserContext';
import { supabase } from '../supabaseClient';

function Turnuva() {
  const { user, setUser } = useContext(UserContext);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <div>
      {/* Kartlar */}
      <div className="container">
        <div className="row justify-content-center mt-5">
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <img src={image} className="card-img-top" alt="elemeimage" />
              <div className="card-body">
                <h5 className="card-title">Elemen Turnuvası</h5>
                <p className="card-text">
                  Turnuvaya katılan takımlar eleme usulüyle eşleşerek rakiplerini yenmeye çalışır. Kazanan üst tura çıkar.
                </p>
                <Link to="/elemination" className="btn btn-primary w-100">Seç</Link>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <img src={lig} className="card-img-top" alt="ligimage" />
              <div className="card-body">
                <h5 className="card-title">Lig Turnuvası</h5>
                <p className="card-text">
                  Turnuvaya katılan takımlar lig usulüyle eşleşerek rakiplerini yenmeye çalışır, en yüksek puanı toplayan şampiyon olur.
                </p>
                <Link to="/lig" className="btn btn-primary w-100">Seç</Link>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <img src={grup} className="card-img-top" alt="grupimage" />
              <div className="card-body">
                <h5 className="card-title">Gruplu Sistem</h5>
                <p className="card-text">
                  Turnuvaya katılan takımlar gruplar halinde eşleşerek rakiplerini yenmeye çalışır. Kazanan üst tura çıkar.
                </p>
                <Link to="/group" className="btn btn-primary w-100">Seç</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {user && (
        <div className="welcome-message">
          <h2 style={{ color: "#f0e4e4ff", fontWeight: "bold", marginRight: "16px" }}>
            Hoşgeldin, {user.user_metadata?.username || user.email}!
          </h2>
          <button
            onClick={handleLogout}
            style={{
              background: "#ed5847",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "5px 16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}

export default Turnuva;