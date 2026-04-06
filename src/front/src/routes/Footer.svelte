<footer class="site-footer">
  <div class="footer-panel">
    <div class="footer-grid">
      <section class="footer-block">
        <h3>Proyecto</h3>
        <p>Grupo SOS2526-24</p>
        <p>Curso 2025/2026</p>
      </section>

      <section class="footer-block">
        <h3>Fuentes de datos</h3>
        <p>Ocio y cultura</p>
        <p>Sueldos medios mensuales</p>
        <p>Costes internacionales de construcción</p>
      </section>

      <section class="footer-block">
        <h3>Tecnologías</h3>
        <p>Svelte · Node.js · Express</p>
        <p>APIs REST · Postman · Render</p>
      </section>
    </div>

    <div class="footer-bottom">
      Universidad de Sevilla · Sistemas Orientados a Servicios (SOS)
    </div>
  </div>
</footer>

<style>
  .site-footer {
    width: 100%;
    padding: 2.2rem 0 2.8rem;
  }

  .footer-panel {
    width: min(1380px, calc(100% - 2.2rem));
    margin: 0 auto;
    padding: 1.8rem 2rem 1.2rem;
    border-radius: 28px;
    background: rgba(235, 244, 240, 0.84);
    box-shadow: 0 14px 34px rgba(58, 81, 76, 0.08);
    backdrop-filter: blur(4px);
    color: #2d4d48;
    font-family:
       "Inter", sans-serif;
    font-weight: 350;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 2rem;
    align-items: start;
    text-align: center;
  }

  .footer-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .footer-block h3 {
    margin: 0 0 0.9rem;
    font-size: 1.15rem;
    color: #102f2c;
  }

  .footer-block p {
    margin: 0.22rem 0;
    line-height: 1.65;
    font-size: 1rem;
    max-width: 320px;
  }

  .footer-bottom {
    margin-top: 1.6rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(56, 86, 79, 0.16);
    text-align: center;
    font-size: 0.98rem;
    color: #52706a;
  }

  @media (max-width: 900px) {
    .footer-panel {
      width: min(100% - 1rem, 1380px);
      padding: 1.5rem 1.2rem 1rem;
    }

    .footer-grid {
      grid-template-columns: 1fr;
      gap: 1.35rem;
    }
  }
</style>