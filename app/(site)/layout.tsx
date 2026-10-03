import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import GoogleAnalytics from "@/components/layout/GoogleAnalytics";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <GoogleAnalytics />
    </>
  );
}
