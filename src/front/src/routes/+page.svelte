


<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SOS2526-24</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Inter", sans-serif;
        min-height: 100vh;
        padding: 20px;
        background: linear-gradient(135deg, #6d1734 0%, #8a2047 35%, #d38b5d 100%);
      }

      .hero {
        max-width: 1250px;
        min-height: 90vh;
        margin: 0 auto;
        border-radius: 28px;
        overflow: hidden;
        position: relative;
        background: linear-gradient(160deg, #4f1025 0%, #7c1d3c 45%, #c77753 100%);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .nav {
        width: calc(100% - 48px);
        margin: 18px auto 0 auto;
        background: rgba(255, 255, 255, 0.94);
        border-radius: 999px;
        padding: 20px 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 28px;
      }

      .brand {
        font-family: "Inter", sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: #1f1f1f;
        white-space: nowrap;
      }

      .nav-links {
        display: flex;
        gap: 40px;
        flex-wrap: wrap;
        align-items: center;
      }

      .nav-links a {
        text-decoration: none;
        color: #1f1f1f;
        font-size: 1rem;
        font-weight: 500;
        transition: opacity 0.2s ease;
      }

      .nav-links a:hover {
        opacity: 0.65;
      }

      .content {
        position: absolute;
        left: 55px;
        top: 170px;
        color: white;
        max-width: 900px;
      }

      .content h1 {
        font-family: "Cormorant Garamond", serif;
        font-size: clamp(3.4rem, 8vw, 6rem);
        line-height: 0.92;
        font-weight: 700;
        margin-bottom: 22px;
      }

      .content h1 span {
        font-style: italic;
        font-weight: 500;
      }

      .content p {
        font-size: 1.12rem;
        line-height: 1.8;
        max-width: 820px;
        color: rgba(255, 255, 255, 0.95);
      }

      .button-circle {
        position: absolute;
        right: 48px;
        bottom: 42px;
        width: 125px;
        height: 125px;
        border-radius: 50%;
        background: #efe48a;
        color: #1f1f1f;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        text-decoration: none;
        font-weight: 700;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
        transition: transform 0.2s ease;
      }

      .button-circle:hover {
        transform: translateY(-2px);
      }

      @media (max-width: 900px) {
        .nav {
          border-radius: 24px;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px 24px;
        }

        .nav-links {
          gap: 18px;
        }

        .content {
          position: static;
          padding: 60px 28px 140px 28px;
        }

        .hero {
          min-height: auto;
        }

        .button-circle {
          right: 24px;
          bottom: 24px;
          width: 100px;
          height: 100px;
          font-size: 0.9rem;
        }
      }
    </style>
  </head>
  <body>
    <main class="hero">
      <nav class="nav">
        <div class="brand">SOS2526-24</div>
        <div class="nav-links">
          <a href="/about">About</a>
          <a href="/api/v1/average-monthly-wages">MJP API</a>
          <a href="/api/v1/international-construccion-costs">IRG API</a>
          <a href="/api/v1/recreation-culture-expenditure">EBP API</a>
          <a href="/api/v1/average-monthly-wages/docs">MJP Docs</a>
          <a href="/api/v1/international-construccion-costs/docs">IRG Docs</a>
          <a href="/api/v1/recreation-culture-expenditure/docs">EBP Docs</a>
        </div>
      </nav>

      <section class="content">
        <h1>Welcome to <br /><span>SOS2526-24</span></h1>
        <p>
          Our project integrates global datasets on construction costs,
          household spending on leisure and culture, and average monthly wages.
          We analyze the economic impact of rising construction prices between
          2020/21 and 2024, exploring the correlation between cost increases,
          purchasing power, and shifts in leisure expenditure to identify global
          trends and cross-country comparisons.
        </p>
      </section>

      <a class="button-circle" href="/about">About Us</a>
    </main>
  </body>
</html>