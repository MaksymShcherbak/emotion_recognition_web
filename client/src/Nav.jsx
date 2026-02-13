import { Link, useLocation } from "react-router-dom";

function Nav() {
  let location = useLocation();

  return (
    <nav>
      <div>
        <Link to="/image">
          <div
            className={
              location.pathname == "/" || location.pathname == "/image"
                ? "selected"
                : ""
            }
          >
            📷 From Image
          </div>
        </Link>
        <Link to="/video">
          <div className={location.pathname == "/video" ? "selected" : ""}>
            📹 From Video
          </div>
        </Link>
        <Link to="/live">
          <div className={location.pathname == "/live" ? "selected" : ""}>
            🔴 Live Emotion Recognition
          </div>
        </Link>
      </div>

      <div>
        <h1>🐵 Emotion Recognition</h1>
        <a
          className="author-link"
          target="_blank"
          href="https://github.com/MaksymShcherbak/emotion_recognition_web"
        >
          <img src="github.svg" />
        </a>
      </div>
    </nav>
  );
}

export default Nav;
