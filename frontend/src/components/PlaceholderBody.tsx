import { AppHeader } from './AppHeader';

/** Temporary page body for role dashboards not yet implemented. */
export function PlaceholderBody({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-full bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          Coming soon
        </div>
      </main>
    </div>
  );
}
