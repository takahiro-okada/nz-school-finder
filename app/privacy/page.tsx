import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy notes for NZ School Finder, including analytics and address search handling.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" href="/">
          Back to map
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Privacy</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-700">
          <p>
            NZ School Finder uses Google Analytics when a measurement ID is configured. Analytics
            helps understand aggregate usage, such as page views, address search attempts, selected
            school filters, and map style changes.
          </p>
          <p>
            Address search text is used in the browser to geocode a location and match enrolment
            zones. The app does not send the typed address to Google Analytics. Analytics events only
            include non-identifying details such as whether a search found coordinates and how many
            schools matched the zone.
          </p>
          <p>
            The app does not provide user accounts and does not intentionally collect personal
            profile information.
          </p>
        </div>
      </div>
    </main>
  );
}
