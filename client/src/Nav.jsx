import {Link, useLocation } from 'react-router-dom'

function Nav() {
  let location = useLocation();

    return <nav>
        <Link to="/image">
          <div className={(location.pathname == "/" || location.pathname == "/image") ?
          "selected" : ""}>📷 From Image</div></Link>
        <Link to="/video">
          <div className={(location.pathname == "/video") ? "selected" : ""}>📹 From Video</div></Link>
        <Link to="/live">
          <div className={(location.pathname == "/live") ? "selected" : ""}>🔴 Live Emotion Recognition</div></Link>
      </nav>;
}

export default Nav;