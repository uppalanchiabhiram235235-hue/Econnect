import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/routes';
import Button from '../components/Button';

/** Shell landing page. The full version (featured events, live impact counters) is built in Phase 5. */
export default function Home() {
  const { user } = useAuth();
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">Community Clean-Up &amp; Cause Coordinator</p>
        <h1>Connect. Contribute. Create Impact.</h1>
        <p className="lead">
          Discover local volunteering opportunities, connect with your community, contribute to meaningful causes,
          and track your verified impact.
        </p>
        <div className="row">
          <Button to="/events" variant="accent" size="lg">Explore Events</Button>
          {user ? (
            <Button to={homePathFor(user)} variant="outline" size="lg">Go to my dashboard</Button>
          ) : (
            <>
              <Button to="/register" variant="outline" size="lg">Join as Volunteer</Button>
              <Button to="/register" variant="ghost" size="lg">Create an Event</Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
