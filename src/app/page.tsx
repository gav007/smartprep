import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users from the root path to the quiz selection page
  redirect('/quiz');
}
