import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} Wings Cafe. All Rights Reserved | System Designed by eterncodes
      </p>
      <div className="footer-links">
        <a
          href="mailto:chukwudidivine20@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Gmail"
        >
          <FaEnvelope />
        </a>
        <a
          href="https://github.com/DivineChukwudi"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
        >
          <FaGithub />
        </a>
        <a
          href="https://www.linkedin.com/in/DivineChukwudi"
          target="_blank"
          rel="noopener noreferrer"
          title="LinkedIn"
        >
          <FaLinkedin />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
