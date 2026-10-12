import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ChevronDown, ChevronUp, Lock, MessageSquare,
  Pin, PinOff, Send, ShieldAlert, Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { relativeTime } from '../lib/format';
import Badge from './Badge';
import Button from './Button';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

export default function EventChat({ event, onJoinSuccess }) {
  const { user } = useAuth();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [joining, setJoining] = useState(false);

  const feedRef = useRef(null);
  const lastMessageIdRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const isAtBottomRef = useRef(true);

  const isOrganizer = user && event && Number(event.organizerId) === Number(user.id);
  const isParticipant =
    user &&
    event &&
    (event.myParticipationStatus === 'REGISTERED' || event.myParticipationStatus === 'COMPLETED');
  const canAccess = isOrganizer || isParticipant;
  const isEventCancelled = event?.status === 'CANCELLED';

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    isAtBottomRef.current = atBottom;
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  // Initial load
  useEffect(() => {
    if (!canAccess || !event?.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api
      .get(`/events/${event.id}/chat`)
      .then((data) => {
        if (!isMounted) return;
        const msgs = data?.messages || [];
        setMessages(msgs);
        setPinnedMessages(data?.pinned || []);
        if (msgs.length > 0) {
          const maxId = Math.max(...msgs.map((m) => m.id));
          lastMessageIdRef.current = maxId;
        }
        lastActivityRef.current = Date.now();
        setTimeout(scrollToBottom, 50);
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error(err.message || 'Unable to load chat messages');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [event?.id, canAccess]);

  // Polling with afterId every 4s, backing off to 10s after 2min of idle, paused when tab hidden
  useEffect(() => {
    if (!canAccess || !event?.id) return;

    let timerId;
    let isMounted = true;

    const poll = async () => {
      try {
        const data = await api.get(`/events/${event.id}/chat`, {
          params: { afterId: lastMessageIdRef.current || undefined },
        });
        if (!isMounted) return;
        const newMsgs = data?.messages || [];
        if (newMsgs.length > 0) {
          lastActivityRef.current = Date.now();
          const maxId = Math.max(...newMsgs.map((m) => m.id));
          lastMessageIdRef.current = Math.max(lastMessageIdRef.current, maxId);

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMsgs.filter((m) => !existingIds.has(m.id));
            if (unique.length === 0) return prev;
            return [...prev, ...unique];
          });

          if (isAtBottomRef.current) {
            setTimeout(scrollToBottom, 30);
          } else {
            setUnreadCount((c) => c + newMsgs.length);
          }
        }
      } catch {
        // Silent polling failure
      }
    };

    const schedule = () => {
      const idleTime = Date.now() - lastActivityRef.current;
      const interval = idleTime > 120_000 ? 10_000 : 4_000;
      timerId = setTimeout(async () => {
        if (!isMounted) return;
        if (document.visibilityState === 'visible') {
          await poll();
        }
        if (isMounted) schedule();
      }, interval);
    };

    schedule();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timerId);
        poll().then(() => {
          if (isMounted) schedule();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [event?.id, canAccess]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending || trimmed.length > 1000) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: trimmed,
      pinned: isAnnouncement && isOrganizer,
      deleted: false,
      createdAt: new Date().toISOString(),
      mine: true,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setContent('');
    setIsAnnouncement(false);
    setSending(true);
    lastActivityRef.current = Date.now();
    setTimeout(scrollToBottom, 20);

    try {
      const saved = await api.post(`/events/${event.id}/chat`, {
        body: { content: trimmed, pinned: optimisticMsg.pinned },
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, saved.id);
      if (saved.pinned) {
        setPinnedMessages((prev) => [...prev, saved]);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setContent(trimmed);
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm('Are you sure you want to remove this message?')) return;
    try {
      const updated = await api.del(`/chat/${msgId}`);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.info('Message removed');
    } catch (err) {
      toast.error(err.message || 'Failed to delete message');
    }
  };

  const handleTogglePin = async (msgId) => {
    try {
      const updated = await api.put(`/chat/${msgId}/pin`);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
      if (updated.pinned) {
        setPinnedMessages((prev) => [...prev.filter((m) => m.id !== msgId), updated]);
        toast.success('Message pinned');
      } else {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
        toast.info('Message unpinned');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update pin');
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/events/${event.id}/join`);
      toast.success('Successfully joined the event! Welcome to the group chat.');
      if (onJoinSuccess) onJoinSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  // Locked state for guests and non-participants
  if (!canAccess) {
    return (
      <div className="card" style={{ padding: 'var(--space-7)', textAlign: 'center' }}>
        <div className="empty__icon" style={{ margin: '0 auto var(--space-4)' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--space-2)' }}>Event Chat is Locked</h2>
        <p className="muted" style={{ maxWidth: '48ch', margin: '0 auto var(--space-5)' }}>
          {!user ? (
            'You must have an account and be registered for this event to participate in the conversation.'
          ) : event?.myParticipationStatus === 'CANCELLED' ? (
            'Your registration for this event was cancelled, so chat access is restricted.'
          ) : (
            'This group chat is reserved for registered volunteers and the event organizer. Join the event to chat with fellow participants!'
          )}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {!user ? (
            <>
              <Button to="/login" variant="primary">Log in to Join</Button>
              <Button to="/register" variant="outline">Create an Account</Button>
            </>
          ) : (
            !isOrganizer && event?.status === 'UPCOMING' && (
              <Button onClick={handleJoin} disabled={joining} variant="primary">
                {joining ? 'Joining...' : 'Join Event Now'}
              </Button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Pinned Announcements Banner */}
      {pinnedMessages.length > 0 && (
        <div className="chat-announcements">
          <div
            className="chat-announcements__header"
            onClick={() => setIsBannerOpen(!isBannerOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsBannerOpen(!isBannerOpen)}
            aria-expanded={isBannerOpen}
            aria-label="Toggle pinned announcements"
          >
            <div className="chat-announcements__title">
              <Pin size={16} />
              <span>Organizer Announcements ({pinnedMessages.length})</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              style={{ width: '32px', height: '32px' }}
              aria-label={isBannerOpen ? 'Collapse announcements' : 'Expand announcements'}
            >
              {isBannerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isBannerOpen && (
            <div className="chat-announcements__body">
              {pinnedMessages.map((m) => (
                <div key={m.id} className="chat-announcement-card">
                  <div style={{ fontWeight: 600 }}>{m.content}</div>
                  <div className="chat-announcement-card__meta">
                    <span>By {m.senderName} ({m.senderRole})</span>
                    <span>{relativeTime(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={feedRef}
        className="chat-feed"
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Event messages"
      >
        {loading ? (
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <Skeleton height="40px" width="60%" />
            <Skeleton height="40px" width="45%" style={{ alignSelf: 'flex-end' }} />
            <Skeleton height="40px" width="55%" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Say hello to your fellow volunteers"
            text="No messages yet in this group chat. Ask questions or share updates!"
          />
        ) : (
          messages.map((m) => {
            const isMine = m.mine || (user && m.senderId === user.id);
            const canDelete = isOrganizer || isMine;
            return (
              <div
                key={m.id}
                className={`chat-message-row ${isMine ? 'chat-message-row--mine' : 'chat-message-row--other'}`}
              >
                <div className="chat-message-meta">
                  <strong>{isMine ? 'You' : m.senderName}</strong>
                  {m.senderRole === 'ORGANIZER' && (
                    <Badge variant="eco">Organizer</Badge>
                  )}
                  <span>{relativeTime(m.createdAt)}</span>
                  {m.pinned && <Badge variant="warning"><Pin size={10} /> Pinned</Badge>}
                </div>

                <div
                  className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--other'} ${
                    m.pinned ? 'chat-bubble--pinned' : ''
                  } ${m.deleted ? 'chat-bubble--deleted' : ''}`}
                >
                  {m.content}
                </div>

                {!m.deleted && (
                  <div className="chat-bubble-actions">
                    {isOrganizer && (
                      <button
                        type="button"
                        className="chat-bubble-action-btn"
                        onClick={() => handleTogglePin(m.id)}
                        aria-label={m.pinned ? 'Unpin announcement' : 'Pin as announcement'}
                        title={m.pinned ? 'Unpin' : 'Pin'}
                      >
                        {m.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                        <span>{m.pinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="chat-bubble-action-btn chat-bubble-action-btn--danger"
                        onClick={() => handleDelete(m.id)}
                        aria-label="Remove message"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Jump to New Messages Button */}
      {unreadCount > 0 && !isAtBottomRef.current && (
        <button
          type="button"
          className="chat-jump-btn"
          onClick={() => {
            scrollToBottom();
            setUnreadCount(0);
          }}
          aria-label={`Jump to ${unreadCount} new messages`}
        >
          <ArrowDown size={16} />
          <span>{unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}</span>
        </button>
      )}

      {/* Composer */}
      {isEventCancelled ? (
        <div style={{ padding: 'var(--space-4)', background: 'var(--danger-soft)', color: 'var(--danger)', textAlign: 'center', fontWeight: 700 }}>
          <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          This event has been cancelled. The chat is in read-only mode.
        </div>
      ) : (
        <form className="chat-composer" onSubmit={handleSend}>
          <div className="chat-composer__options">
            {isOrganizer ? (
              <label className="chat-composer__toggle">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                />
                <Pin size={14} />
                <span>Post as Pinned Announcement</span>
              </label>
            ) : <span />}

            <span className="muted" style={{ color: content.length > 900 ? 'var(--danger)' : undefined }}>
              {content.length} / 1000
            </span>
          </div>

          <div className="chat-composer__row">
            <textarea
              className="chat-composer__textarea"
              placeholder={isAnnouncement ? 'Post an important announcement for volunteers...' : 'Type a message... (Press Enter to send, Shift+Enter for new line)'}
              value={content}
              maxLength={1000}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
              rows={2}
              aria-label="Message text"
            />
            <Button
              type="submit"
              variant={isAnnouncement ? 'accent' : 'primary'}
              disabled={!content.trim() || sending || content.length > 1000}
              aria-label="Send message"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
