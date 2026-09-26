import NotFoundContent from "@/components/layout/NotFoundContent";

/** notFound() inside the site (e.g. a removed listing) renders within (site)/layout, which already has the header and footer. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
