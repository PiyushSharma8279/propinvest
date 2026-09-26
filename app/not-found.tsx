import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotFoundContent from "@/components/layout/NotFoundContent";

/**
 * Unknown URLs outside the (site) route group render here, with only the root layout,
 * so this page adds its own header and footer. 404s inside the site use app/(site)/not-found.tsx.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
