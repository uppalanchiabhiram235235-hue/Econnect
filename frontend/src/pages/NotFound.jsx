import { SearchX } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState icon={SearchX} title="We couldn't find that page" text="The link may be broken or the page may have moved." action={<Button to="/">Back to home</Button>} />
    </div>
  );
}
