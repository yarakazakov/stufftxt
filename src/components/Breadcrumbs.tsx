import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav style={{ marginBottom: 16, color: "#666", fontSize: 13 }}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && " > "}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span style={i === items.length - 1 ? { color: "#000" } : undefined}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
