import Link from "next/link";

type WorkflowPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  items: string[];
};

export function WorkflowPage({ title, eyebrow, description, items }: WorkflowPageProps) {
  return (
    <main className="shell">
      <nav aria-label="Breadcrumb">
        <Link href="/" className="back-link">
          ← Back to Studio
        </Link>
      </nav>

      <section className="hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </section>

      <section className="grid" aria-label={`${title} implementation areas`}>
        {items.map((item) => (
          <article className="card" key={item}>
            <h2>{item}</h2>
            <p>Placeholder for the first functional implementation pass.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
