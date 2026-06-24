import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="container" style={{ textAlign: "center", padding: "8vh 20px" }}>
        <h1 style={{ fontSize: "3rem" }}>404</h1>
        <p className="muted" style={{ margin: "10px 0 24px" }}>Страница не найдена.</p>
        <Link className="btn btn--primary" href="/">На главную</Link>
      </div>
    </main>
  );
}
