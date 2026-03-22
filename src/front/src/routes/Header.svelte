<header class="main-header">
  <nav class="nav-container">
    <div class="brand">
      <a href="/">SOS2526-24</a>
    </div>

    <ul class="nav-menu">
      <li><a href="/about">About</a></li>

      <li class="dropdown">
        <button class="dropbtn">Isaac ▾</button>
        <div class="dropdown-content">
          <span class="resource-label">Recurso: <code>[tu-recurso]</code></span>
          <hr />
          <a href="/front/isaac">🎨 Front-end</a>
          <a href="/api/v1/[tu-recurso]" target="_blank">🔌 API Base</a>
          <a href="/api/v1/[tu-recurso]/docs" target="_blank">📄 Postman Docs</a>
        </div>
      </li>

      <li class="dropdown">
        <button class="dropbtn">MJP ▾</button>
        <div class="dropdown-content">
          <span class="resource-label">Recurso: <code>average-monthly-wages</code></span>
          <hr />
          <a href="/front/mjp">🎨 Front-end</a>
          <a href="/api/v1/average-monthly-wages" target="_blank">🔌 API Base</a>
          <a href="/api/v1/average-monthly-wages/docs" target="_blank">📄 Postman Docs</a>
        </div>
      </li>

      <li class="dropdown">
        <button class="dropbtn">IRG ▾</button>
        <div class="dropdown-content">
          <span class="resource-label">Recurso: <code>intl-construction-costs</code></span>
          <hr />
          <a href="/front/irg">🎨 Front-end</a>
          <a href="/api/v1/international-construction-costs" target="_blank">🔌 API Base</a>
          <a href="/api/v1/international-construction-costs/docs" target="_blank">📄 Postman Docs</a>
        </div>
      </li>

      <li class="dropdown">
        <button class="dropbtn">EBP ▾</button>
        <div class="dropdown-content">
          <span class="resource-label">Recurso: <code>recreation-culture</code></span>
          <hr />
          <a href="/front/ebp">🎨 Front-end</a>
          <a href="/api/v1/recreation-culture-expenditure" target="_blank">🔌 API Base</a>
          <a href="/api/v1/recreation-culture-expenditure/docs" target="_blank">📄 Postman Docs</a>
        </div>
      </li>
    </ul>

    <div class="nav-git">
      <a href="https://github.com/gti-sos/SOS2425-24" target="_blank" class="github-link">
        GitHub 📂
      </a>
    </div>
  </nav>
</header>

<style>
  .main-header {
    background-color: #222;
    color: white;
    padding: 0 2rem;
    font-family: sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    height: 60px;
  }

  .brand a {
    font-weight: bold;
    font-size: 1.2rem;
    color: #ff3e00;
    text-decoration: none;
  }

  .nav-menu {
    display: flex;
    list-style: none;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
  }

  .nav-menu a, .dropbtn {
    color: #ccc;
    text-decoration: none;
    font-size: 0.95rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
  }

  .nav-menu a:hover, .dropbtn:hover {
    color: white;
  }

  /* Dropdown Logic */
  .dropdown { position: relative; display: inline-block; }

  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #333;
    min-width: 220px;
    box-shadow: 0px 8px 16px rgba(0,0,0,0.2);
    z-index: 1;
    border-radius: 4px;
    top: 100%;
    padding: 0.5rem 0;
  }

  .dropdown:hover .dropdown-content { display: block; }

  .dropdown-content a {
    color: #ddd;
    padding: 12px 16px;
    display: block;
    font-size: 0.85rem;
  }

  .dropdown-content a:hover { background-color: #444; color: #ff3e00; }

  .resource-label {
    display: block;
    padding: 5px 16px;
    font-size: 0.75rem;
    color: #888;
  }

  hr { border: 0; border-top: 1px solid #444; margin: 5px 0; }

  .github-link {
    background: #444;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    text-decoration: none;
    color: white;
  }

  .github-link:hover { background: #ff3e00; }
</style>
