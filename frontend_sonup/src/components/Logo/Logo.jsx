const Logo = () => (
  <div className="brand-logo">
    <p className="brand-logo__text">
      <span className="brand-logo__orange">asis</span>
      <span className="brand-logo__teal">co</span>
    </p>
    <span className="brand-logo__tagline">
      Asociación de Interés Social Comunitario
    </span>

    <style>{`
      .brand-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0.25rem;
      }
      .brand-logo__text {
        font-family: 'Fredoka', sans-serif;
        font-size: clamp(2.2rem, 5vw, 3rem);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.01em;
      }
      .brand-logo__orange { color: #F49A18; }
      .brand-logo__teal   { color: #176D65; }
      .brand-logo__tagline {
        font-size: clamp(0.5rem, 1vw, 0.65rem);
        color: #687974;
        letter-spacing: 0.04em;
        text-align: center;
        margin-top: 0.1rem;
      }
    `}</style>
  </div>
)

export default Logo
