<footer class="site-footer" id="footer-info">
  <div class="footer-grid">
    <section>
      <h3>Proyecto</h3>
      <p>Grupo SOS2526-24</p>
      <p>Curso 2025/2026</p>
    </section>

    <section>
      <h3>Fuentes de datos</h3>
      <p>Ocio y cultura · Sueldos medios mensuales · Costes internacionales de construcción</p>
    </section>

    <section>
      <h3>Tecnologías</h3>
      <p>Svelte · Node.js · Express · APIs REST · Postman · Render</p>
    </section>
  </div>

  <div class="footer-bottom">
    <p>Universidad de Sevilla · Sistemas Orientados a Servicios (SOS)</p>
  </div>
</footer>

<style>
  .site-footer {
    width: min(1200px, calc(100% - 2rem));
    margin: 0 auto 1.5rem;
    padding: 1.4rem 1.4rem 1rem;
    border-radius: 28px;
    border: 1px solid rgba(37, 53, 49, 0.08);
    background:
      linear-gradient(180deg, rgba(240, 246, 242, 0.9), rgba(223, 238, 232, 0.78));
    box-shadow: 0 16px 36px rgba(55, 79, 72, 0.08);
  }

  .footer-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .site-footer h3 {
    margin: 0 0 0.65rem;
    font-size: 0.95rem;
    color: #1d3732;
  }

  .site-footer p {
    margin: 0.18rem 0;
    color: #39554f;
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .footer-bottom {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(37, 53, 49, 0.08);
    text-align: center;
  }

  .footer-bottom p {
    margin: 0;
    color: #47635d;
    font-size: 0.84rem;
  }

  @media (max-width: 900px) {
    .footer-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .site-footer {
      width: min(100% - 1rem, 1200px);
    }

    .footer-grid {
      grid-template-columns: 1fr;
    }
  }
</style>