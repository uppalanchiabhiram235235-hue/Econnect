import { useState } from 'react';
import { Inbox, Leaf, Trash2 } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Field from '../components/Field';
import { ConfirmDialog } from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import { CardSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { EVENT_TYPES } from '../lib/eventMeta';

/** Living reference for every shared component and token. Handy for visual checks in both themes. */
export default function Styleguide() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div className="container page stack">
      <div className="page__header"><h1>Styleguide</h1><p>Shared building blocks used across ECONNECT.</p></div>

      <Card className="stack">
        <h3>Buttons</h3>
        <div className="row">
          <Button>Primary</Button><Button variant="accent">Accent</Button><Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button><Button variant="danger" icon={Trash2}>Danger</Button>
          <Button loading>Loading</Button><Button disabled>Disabled</Button>
        </div>
      </Card>

      <Card className="stack">
        <h3>Badges</h3>
        <div className="row">
          <Badge>Neutral</Badge><Badge tone="success">Verified</Badge><Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Cancelled</Badge><Badge tone="info">Upcoming</Badge><Badge tone="eco" icon={Leaf}>Eco</Badge>
        </div>
        <div className="row">
          {Object.values(EVENT_TYPES).map(({ label, icon, hue }) => <Badge key={label} hue={hue} icon={icon}>{label}</Badge>)}
        </div>
      </Card>

      <Card className="stack">
        <h3>Progress</h3>
        <ProgressBar value={30} max={100} label="30 percent" />
        <ProgressBar value={80} max={100} label="80 percent" />
        <ProgressBar value={20} max={20} label="Full" />
      </Card>

      <Card className="stack">
        <h3>Form field with error</h3>
        <Field label="Email" hint="We never share it." error="Enter a valid email address."><input className="input" /></Field>
      </Card>

      <Card className="row">
        <Button variant="outline" onClick={() => toast.success('Saved successfully')}>Success toast</Button>
        <Button variant="outline" onClick={() => toast.error('Something went wrong')}>Error toast</Button>
        <Button variant="outline" onClick={() => toast.info('Heads up!')}>Info toast</Button>
        <Button variant="danger" onClick={() => setOpen(true)}>Open confirm dialog</Button>
      </Card>

      <div className="grid grid--cards"><CardSkeleton /><CardSkeleton /></div>
      <Card><EmptyState icon={Inbox} title="Nothing here yet" text="Empty states always suggest a next step." action={<Button variant="outline">Do something</Button>} /></Card>

      <ConfirmDialog open={open} danger title="Leave this event?" message="You can rejoin later if there are still free slots."
        confirmLabel="Leave event" onConfirm={() => { setOpen(false); toast.success('You left the event'); }} onCancel={() => setOpen(false)} />
    </div>
  );
}
