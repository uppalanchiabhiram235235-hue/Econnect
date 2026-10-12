import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Save, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { eventTypeOptions } from '../lib/eventMeta';
import Field from '../components/Field';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

const LocationPickerMap = React.lazy(() => import('../components/map/LocationPickerMap'));

export default function EventForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'COMMUNITY_CLEANUP',
    location: '',
    eventDate: '',
    startTime: '09:00',
    endTime: '12:00',
    maxVolunteers: 20,
    requiredVolunteers: 10,
    objectives: '',
    status: 'UPCOMING',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (isEdit && id) {
      api
        .get(`/events/${id}`)
        .then((e) => {
          setForm({
            title: e.title || '',
            description: e.description || '',
            eventType: e.eventType || 'COMMUNITY_CLEANUP',
            location: e.location || '',
            eventDate: e.eventDate || '',
            startTime: e.startTime ? e.startTime.slice(0, 5) : '09:00',
            endTime: e.endTime ? e.endTime.slice(0, 5) : '12:00',
            maxVolunteers: e.maxVolunteers || 20,
            requiredVolunteers: e.requiredVolunteers || 10,
            objectives: e.objectives || '',
            status: e.status || 'UPCOMING',
            latitude: e.latitude != null ? Number(e.latitude) : null,
            longitude: e.longitude != null ? Number(e.longitude) : null,
          });
        })
        .catch((err) => {
          toast.error(err.message || 'Failed to load event data');
          navigate('/events');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCoordinatesChange = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      ...form,
      maxVolunteers: Number(form.maxVolunteers),
      requiredVolunteers: form.requiredVolunteers ? Number(form.requiredVolunteers) : undefined,
      latitude: form.latitude != null ? form.latitude : undefined,
      longitude: form.longitude != null ? form.longitude : undefined,
    };

    try {
      let saved;
      if (isEdit) {
        saved = await api.put(`/events/${id}`, { body: payload });
        toast.success('Event updated successfully!');
      } else {
        saved = await api.post('/events', { body: payload });
        toast.success('Event created successfully!');
      }
      navigate(`/events/${saved.id}`);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      }
      toast.error(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <Skeleton height="36px" width="240px" style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height="500px" />
      </div>
    );
  }

  return (
    <div className="container page" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to={isEdit ? `/events/${id}` : '/events'} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> {isEdit ? 'Back to Event' : 'Back to Events'}
        </Link>
      </div>

      <div className="card">
        <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--space-4)' }}>
          {isEdit ? 'Edit Event' : 'Create a New Cause / Event'}
        </h1>

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 'var(--space-4)' }}>
          <Field label="Event Title" error={errors.title} required>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="e.g. Lake Hussain Sagar Clean-Up"
              value={form.title}
              onChange={handleChange}
              required
            />
          </Field>

          <div className="form-grid">
            <Field label="Cause Category" error={errors.eventType} required>
              <select
                name="eventType"
                className="select"
                value={form.eventType}
                onChange={handleChange}
                required
              >
                {eventTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            {isEdit && (
              <Field label="Event Status" error={errors.status}>
                <select
                  name="status"
                  className="select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </Field>
            )}
          </div>

          <Field label="Venue Address / Location Name" error={errors.location} required>
            <input
              type="text"
              name="location"
              className="input"
              placeholder="e.g. Tank Bund Road, Hyderabad"
              value={form.location}
              onChange={handleChange}
              required
            />
          </Field>

          {/* Interactive Map Location Picker */}
          <Suspense fallback={<Skeleton height="320px" radius="var(--radius-md)" />}>
            <LocationPickerMap
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={handleCoordinatesChange}
            />
          </Suspense>

          <div className="form-grid">
            <Field label="Event Date" error={errors.eventDate} required>
              <input
                type="date"
                name="eventDate"
                className="input"
                value={form.eventDate}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Start Time" error={errors.startTime} required>
              <input
                type="time"
                name="startTime"
                className="input"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="End Time" error={errors.endTime} required>
              <input
                type="time"
                name="endTime"
                className="input"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </Field>
          </div>

          <div className="form-grid">
            <Field label="Max Volunteer Capacity" error={errors.maxVolunteers} required>
              <input
                type="number"
                name="maxVolunteers"
                className="input"
                min={1}
                value={form.maxVolunteers}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Target / Required Volunteers" error={errors.requiredVolunteers}>
              <input
                type="number"
                name="requiredVolunteers"
                className="input"
                min={1}
                value={form.requiredVolunteers}
                onChange={handleChange}
              />
            </Field>
          </div>

          <Field label="Description" error={errors.description}>
            <textarea
              name="description"
              className="textarea"
              placeholder="Tell volunteers what the event is about, what they need to bring, and what to expect."
              value={form.description}
              onChange={handleChange}
            />
          </Field>

          <Field label="Key Objectives" error={errors.objectives}>
            <textarea
              name="objectives"
              className="textarea"
              placeholder="Specific goals (e.g. collect 50 bags of plastic waste, plant 100 saplings)."
              value={form.objectives}
              onChange={handleChange}
            />
          </Field>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <Button
              to={isEdit ? `/events/${id}` : '/events'}
              variant="ghost"
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              <Save size={16} /> {submitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
