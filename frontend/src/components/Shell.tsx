import { useLocation } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/vendedor");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
