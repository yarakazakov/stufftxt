import Link from "next/link";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <div style={{ marginTop: 40 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
        <Logo size={40} />
        stuff.txt
      </h1>
      <p style={{ margin: "8px 0 24px", color: "#666" }}>
        create and share your wishlists
      </p>
      <p>
        <Link href="/login">log in</Link>
        {" | "}
        <Link href="/register">register</Link>
        {" | "}
        <Link href="/search">search users</Link>
      </p>
    </div>
  );
}
