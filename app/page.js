export default function HomePage() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">CI/CD Demo</p>
        <h1>Next.js desplegado con Jenkins</h1>
        <p className="lede">
          Esta pagina se construye, valida, empaqueta en Docker y se publica
          desde un pipeline declarativo de Jenkins.
        </p>
        <div className="status">
          <span className="dot" aria-hidden="true" />
          Pipeline listo para probar
        </div>
      </section>
    </main>
  );
}
