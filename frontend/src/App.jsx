import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ComingSoon from './pages/ComingSoon';
import Styleguide from './pages/Styleguide';
import EventsDiscover from './pages/EventsDiscover';
import EventDetail from './pages/EventDetail';
import JoinedEvents from './pages/JoinedEvents';

import EventForm from './pages/EventForm';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ManageEvents from './pages/ManageEvents';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Certificate from './pages/Certificate';
import VerifyCertificate from './pages/VerifyCertificate';

const soon = (title, phase) => <ComingSoon title={title} phase={phase} />;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<EventsDiscover />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/chat" element={<EventDetail initialTab="chat" />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/verify/:code" element={<VerifyCertificate />} />
        <Route path="/styleguide" element={<Styleguide />} />

        {/* Any signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/certificate/:participationId" element={<Certificate />} />
        </Route>

        {/* Volunteer */}
        <Route element={<ProtectedRoute role="VOLUNTEER" />}>
          <Route path="/dashboard" element={soon('Volunteer Dashboard', 3)} />
          <Route path="/my-events" element={<JoinedEvents />} />
          <Route path="/badges" element={soon('Badges', 3)} />
        </Route>

        {/* Organizer */}
        <Route element={<ProtectedRoute role="ORGANIZER" />}>
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/organizer/events" element={<ManageEvents />} />
          <Route path="/organizer/events/new" element={<EventForm />} />
          <Route path="/organizer/events/:id/edit" element={<EventForm isEdit />} />
          <Route path="/organizer/events/:id/participants" element={soon('Participants & Attendance', 4)} />
          <Route path="/organizer/events/:id/impact" element={soon('Impact Records', 4)} />
          <Route path="/organizer/events/:id/stats" element={soon('Event Statistics', 4)} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
