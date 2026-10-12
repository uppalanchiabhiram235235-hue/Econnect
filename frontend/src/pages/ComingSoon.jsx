import { Hammer } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function ComingSoon({ title, phase }) {
  return (
    <div className="container page">
      <div className="page__header"><h1>{title}</h1></div>
      <EmptyState
        icon={Hammer}
        title="This screen is built in a later phase"
        text={`The route, role guard and navigation are ready. The ${title} screen is part of Phase ${phase}.`}
        action={<Button to="/" variant="outline">Back to home</Button>}
      />
    </div>
  );
}
