import { Card } from "@/components/ui/Card";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card className="p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </Card>
    </div>
  );
}
