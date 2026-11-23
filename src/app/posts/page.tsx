'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MapPin, MessageCircle, ThumbsUp, Bookmark, ShieldCheck, Pencil, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CivicScoreBadge from '@/components/CivicScoreBadge';
import { useAuth } from '@/lib/auth-context';

interface PostComment {
  id: string;
  body: string;
  createdAt: string;
  authorId?: string;
  authorUsername: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  authorRole?: string;
  authorDesignation?: string | null;
  authorCivicScore?: number;
  authorIsBanned?: boolean;
  authorIsStarred?: boolean;
}

interface CityPost {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  addressDescription: string;
  createdAt: string;
  authorId?: string;
  authorUsername: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  authorRole?: string;
  authorCivicScore?: number;
  authorIsBanned?: boolean;
  authorIsStarred?: boolean;
  plusOneCount: number;
  reactedByMe: boolean;
  comments: PostComment[];
}

function statusOrder(status: string) {
  if (status === 'PROVISIONALLY_RESOLVED') return 0;
  if (['IN_PROGRESS', 'ASSIGNED', 'DISPUTED'].includes(status)) return 1;
  if (status === 'OPEN') return 2;
  if (['CLOSED', 'RESOLVED'].includes(status)) return 3;
  return 2;
}

export default function PostsPage() {
  const { user, loading: authLoading } = useAuth();
  const canInteract = !authLoading && Boolean(user);
  const isAuthority = user?.role === 'AUTHORITY';
  const [posts, setPosts] = useState<CityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reactionBusy, setReactionBusy] = useState<string | null>(null);
  const [commentBusy, setCommentBusy] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({});
  const [expandedCommentAuthors, setExpandedCommentAuthors] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState<string>('');
  const [editBusy, setEditBusy] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  useEffect(() => {
    try {
      // Purge legacy global key that leaked saved posts across users
      localStorage.removeItem('citynova_saved_posts');

      if (!user?.id) {
        setSavedPostIds([]);
        return;
      }
      const key = `citynova_saved_posts_${user.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setSavedPostIds(JSON.parse(stored));
      } else {
        setSavedPostIds([]);
      }
    } catch {}
  }, [user?.id]);

  const toggleSavePost = (postId: string) => {
    if (!user?.id) return;
    setSavedPostIds((prev) => {
      const updated = prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];
      try {
        const key = `citynova_saved_posts_${user.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
  const orderedPosts = [...posts].sort((a, b) =>
    statusOrder(a.status) - statusOrder(b.status) ||
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const loadPosts = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load posts.');
      setPosts(data.posts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const toggleReaction = async (post: CityPost) => {
    setReactionBusy(post.id);
    setError('');
    try {
      const response = await fetch(`/api/posts/${post.id}/reaction`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update your +1.');
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, plusOneCount: data.plusOneCount, reactedByMe: data.reactedByMe }
        : item));
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : 'Could not update your +1.');
    } finally {
      setReactionBusy(null);
    }
  };

  const addComment = async (event: FormEvent<HTMLFormElement>, post: CityPost) => {
    event.preventDefault();
    const body = (drafts[post.id] ?? '').trim();
    if (!body) return;
    setCommentBusy(post.id);
    setError('');
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not post your comment.');
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, comments: [...item.comments, data.comment] }
        : item));
      setDrafts((current) => ({ ...current, [post.id]: '' }));
      setExpandedComments((current) => ({ ...current, [post.id]: true }));
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Could not post your comment.');
    } finally {
      setCommentBusy(null);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const toggleAuthor = (postId: string) => {
    setExpandedAuthors((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const toggleCommentAuthor = (commentId: string) => {
    setExpandedCommentAuthors((current) => ({ ...current, [commentId]: !current[commentId] }));
  };

  const startEditingComment = (comment: PostComment) => {
    setEditingCommentId(comment.id);
    setEditingBody(comment.body);
    setEditError('');
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingBody('');
    setEditError('');
  };

  const saveEditedComment = async (postId: string, commentId: string) => {
    const trimmed = editingBody.trim();
    if (!trimmed) return;
    setEditBusy(true);
    setEditError('');
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, body: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update comment.');
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: item.comments.map((c) =>
                  c.id === commentId ? { ...c, body: data.comment.body } : c
                ),
              }
            : item
        )
      );
      setEditingCommentId(null);
      setEditingBody('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not update comment.');
    } finally {
      setEditBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-700">Community posts</p>
          <h1 className="mt-2 text-3xl font-black">Complaints in {user?.city?.name || 'your city'}</h1>
          <p className="mt-2 text-sm text-slate-600">Discuss reported issues with people in your city. Post authors are shown by username.</p>
        </header>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
        {loading && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading city posts...</p>}
        {!loading && !posts.length && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-lg font-bold">No complaints have been posted yet</h2>
            <p className="mt-1 text-sm text-slate-500">New complaints registered in {user?.city?.name || 'your city'} will appear here.</p>
            {user?.role !== 'AUTHORITY' && <Link href="/report" className="mt-5 inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700">Report a problem</Link>}
          </div>
        )}

        <div className="space-y-4">
          {orderedPosts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {isAuthority ? (
                    /* Municipal Authority view: Click username/avatar to directly open citizen profile (score, date & time hidden) */
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/profile/${post.authorUsername}`}
                        className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer shadow-xs"
                        title={`Open profile for @${post.authorUsername}`}
                      >
                        {post.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.authorAvatarUrl}
                            alt={post.authorUsername}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(post.authorName || post.authorUsername).slice(0, 2).toUpperCase()}</span>
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/profile/${post.authorUsername}`}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title={`Click to open @${post.authorUsername}'s profile`}
                        >
                          <span>@{post.authorUsername}</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* Citizen view: Click username to toggle civic score, date & time; no profile link */
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleAuthor(post.id)}
                        className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
                        title={expandedAuthors[post.id] ? 'Hide civic score, date & time' : 'Click to view civic score, date & time'}
                      >
                        {post.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.authorAvatarUrl}
                            alt={post.authorUsername}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(post.authorName || post.authorUsername).slice(0, 2).toUpperCase()}</span>
                        )}
                      </button>
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAuthor(post.id)}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title={expandedAuthors[post.id] ? 'Hide civic score, date & time' : 'Click to view civic score, date & time'}
                        >
                          <span>@{post.authorUsername}</span>
                          <span className="text-[10px] text-slate-400">
                            {expandedAuthors[post.id] ? '▲' : '▼'}
                          </span>
                        </button>

                        {expandedAuthors[post.id] && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                            <CivicScoreBadge
                              score={post.authorCivicScore ?? 50}
                              isBanned={post.authorIsBanned}
                              size="sm"
                              hideIcon
                              hideTierLabel
                            />
                            <span className="text-xs text-slate-500">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {post.status.toUpperCase() === 'RESOLVED' ? 'CLOSED' : post.status.replaceAll('_', ' ')}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700">{post.category}</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">{post.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{post.addressDescription}</span>
                  {user?.role === 'AUTHORITY' ? (
                    <Link href={`/authority/complaints/${post.caseId}`} className="inline-flex rounded-lg bg-blue-700 px-3 py-1.5 font-bold text-white hover:bg-blue-800">View Complaint</Link>
                  ) : (
                    <Link href={`/ticket/${post.caseId}`} className="inline-flex rounded-lg bg-blue-700 px-3 py-1.5 font-bold text-white hover:bg-blue-800">View Complaint</Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canInteract ? (
                    <button
                      type="button"
                      onClick={() => void toggleReaction(post)}
                      disabled={reactionBusy === post.id}
                      aria-pressed={post.reactedByMe}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${post.reactedByMe ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      +1 <span>{post.plusOneCount}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-600">
                      <ThumbsUp className="h-4 w-4" />
                      +1 <span>{post.plusOneCount}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition-all ${
                      expandedComments[post.id]
                        ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={expandedComments[post.id] ? 'Hide comments' : 'Show comments'}
                  >
                    <MessageCircle className={`h-4 w-4 ${expandedComments[post.id] ? 'fill-blue-600 text-blue-600' : ''}`} />
                    <span>{post.comments.length > 0 ? `Comments (${post.comments.length})` : 'Comment'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSavePost(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition-all ${
                      savedPostIds.includes(post.id)
                        ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={savedPostIds.includes(post.id) ? 'Remove from Saved' : 'Save post to your Profile'}
                  >
                    <Bookmark className={`h-4 w-4 ${savedPostIds.includes(post.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{savedPostIds.includes(post.id) ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <section className="border-t border-slate-100 pt-4">
                    {post.comments.length > 0 ? (
                      <div className="mb-4 space-y-3">
                        {post.comments.map((comment) => {
                          const isMyComment = canInteract && Boolean(
                            (user?.id && comment.authorId && comment.authorId === user.id) ||
                            (user?.username && comment.authorUsername === user.username)
                          );
                          const isEditingThis = editingCommentId === comment.id;

                          return (
                            <div key={comment.id} className="rounded-xl bg-slate-50 px-3.5 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {isAuthority && comment.authorRole !== 'AUTHORITY' ? (
                                    <Link
                                      href={`/profile/${comment.authorUsername}`}
                                      className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
                                      title={`Open profile for @${comment.authorUsername}`}
                                    >
                                      {comment.authorAvatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={comment.authorAvatarUrl}
                                          alt={comment.authorName || comment.authorUsername}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span>{(comment.authorName || comment.authorUsername).slice(0, 2).toUpperCase()}</span>
                                      )}
                                    </Link>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0 overflow-hidden border border-slate-200">
                                      {comment.authorAvatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={comment.authorAvatarUrl}
                                          alt={comment.authorName || comment.authorUsername}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span>{(comment.authorName || comment.authorUsername).slice(0, 2).toUpperCase()}</span>
                                      )}
                                    </div>
                                  )}

                                  {comment.authorRole === 'AUTHORITY' ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-900">{comment.authorName || 'Authority Official'}</span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                                        <ShieldCheck className="w-3 h-3 text-blue-700" />
                                        <span>{comment.authorDesignation || 'Authority Official'}</span>
                                      </span>
                                    </div>
                                  ) : isAuthority ? (
                                    /* Authority viewing a citizen comment: direct link to profile (score, date & time hidden) */
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Link
                                        href={`/profile/${comment.authorUsername}`}
                                        className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                                        title={`Click to open @${comment.authorUsername}'s profile`}
                                      >
                                        <span>@{comment.authorUsername}</span>
                                      </Link>
                                    </div>
                                  ) : (
                                    /* Citizen viewing a citizen comment: toggle civic score, date & time; no profile link */
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => toggleCommentAuthor(comment.id)}
                                        className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center gap-1"
                                        title={expandedCommentAuthors[comment.id] ? 'Hide civic score, date & time' : 'Click to view civic score, date & time'}
                                      >
                                        <span>@{comment.authorUsername}</span>
                                        <span className="text-[9px] text-slate-400">
                                          {expandedCommentAuthors[comment.id] ? '▲' : '▼'}
                                        </span>
                                      </button>

                                      {expandedCommentAuthors[comment.id] && (
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                                          <CivicScoreBadge
                                            score={comment.authorCivicScore ?? 50}
                                            isBanned={comment.authorIsBanned}
                                            size="sm"
                                            hideIcon
                                            hideTierLabel
                                          />
                                          <span className="text-[11px] text-slate-500">
                                            {new Date(comment.createdAt).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {comment.authorRole === 'AUTHORITY' && (
                                    <time className="text-[11px] text-slate-500">{new Date(comment.createdAt).toLocaleString()}</time>
                                  )}
                                  {isMyComment && !isEditingThis && (
                                    <button
                                      type="button"
                                      onClick={() => startEditingComment(comment)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors ml-1"
                                      title="Edit your comment"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isEditingThis ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={editingBody}
                                    onChange={(e) => setEditingBody(e.target.value)}
                                    maxLength={1000}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Edit your comment..."
                                    autoFocus
                                  />
                                  {editError && <p className="text-xs font-medium text-red-600">{editError}</p>}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={editBusy || !editingBody.trim()}
                                      onClick={() => void saveEditedComment(post.id, comment.id)}
                                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {editBusy ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={editBusy}
                                      onClick={cancelEditingComment}
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="mb-4 text-xs text-slate-500">No comments yet.</p>}

                    {canInteract && <form onSubmit={(event) => void addComment(event, post)} className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={drafts[post.id] ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        maxLength={1000}
                        placeholder="Add a comment..."
                        aria-label={`Comment on ${post.title}`}
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <button type="submit" disabled={commentBusy === post.id || !(drafts[post.id] ?? '').trim()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {commentBusy === post.id ? 'Posting...' : 'Comment'}
                      </button>
                    </form>}
                  </section>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
