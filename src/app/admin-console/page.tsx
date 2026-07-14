import { redirect } from 'next/navigation';

// Root /admin-console → redirect to Home Dashboard
export default function AdminConsoleRoot() {
  redirect('/admin-console/home');
}
