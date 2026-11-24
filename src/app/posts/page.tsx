'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  MapPin,
  MessageCircle,
  ThumbsUp,
  Bookmark,
  ShieldCheck,
  Pencil,
  Star,
  Search,
  X,
  Tag,
  Calendar,
  RotateCcw,
  MoreVertical,
  Trash2,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CivicScoreBadge from '@/components/CivicScoreBadge';
import { useAuth } from '@/lib/auth-context';
import { parsePhotoUrls } from '@/lib/photos';

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
  initialPhotoUrl?: string | null;
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

  // Delete post state
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<CityPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post.');
      }
      setPosts((current) => current.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
      setDeleteSuccess('Post deleted successfully.');
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  };
  const orderedPosts = [...posts].sort((a, b) =>
    statusOrder(a.status) - statusOrder(b.status) ||
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Search parameters: category name, keyword from report title, username, public grievance ID, date
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Extract unique categories dynamically from loaded posts
  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));

  const filteredPosts = orderedPosts.filter((post) => {
    // 1. Category Filter
    if (selectedCategory !== 'ALL' && post.category !== selectedCategory) {
      return false;
    }

    // 2. Date Filter (YYYY-MM-DD)
    if (selectedDate) {
      const postDate = new Date(post.createdAt).toISOString().split('T')[0];
      if (postDate !== selectedDate) {
        return false;
      }
    }

    // 3. Search Query Filter across title keywords, username, case ID, category, date
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
      const matchesTitle = post.title?.toLowerCase().includes(q);
      const matchesCaseId = post.caseId?.toLowerCase().includes(q);
      const matchesUsername =
        post.authorUsername?.toLowerCase().includes(q) ||
        post.authorName?.toLowerCase().includes(q);
      const matchesCategory = post.category?.toLowerCase().includes(q);
      const matchesDescription = post.description?.toLowerCase().includes(q);
      const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).toLowerCase();
      const matchesDate = dateStr.includes(q);

      if (
        !matchesTitle &&
        !matchesCaseId &&
        !matchesUsername &&
        !matchesCategory &&
        !matchesDescription &&
        !matchesDate
      ) {
        return false;
      }
    }

    return true;
  });

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
        {/* Search Bar & Multi-Parameter Filter Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Grievance Search &amp; Discovery</p>
              <h1 className="mt-0.5 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Search Complaints in {user?.city?.name || 'your city'}
              </h1>
            </div>
            {(searchQuery || selectedCategory !== 'ALL' || selectedDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedDate('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer self-start sm:self-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset search</span>
              </button>
            )}
          </div>

          {/* Primary Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report title, @username, Case ID (CTN-...), or category..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Parameters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Category Parameter Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="search-category" className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Category:</span>
              </label>
              <select
                id="search-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="ALL">All Categories ({posts.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Parameter Picker */}
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="search-date" className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date:</span>
              </label>
              <input
                id="search-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Results Count */}
            <div className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Showing {filteredPosts.length} of {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </div>
          </div>
        </section>

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

        {!loading && posts.length > 0 && filteredPosts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
            <Search className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">No complaints match your search</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any posts matching your current filters. Try searching for different keywords, username, Case ID, or resetting the filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedDate('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset search filters</span>
            </button>
          </div>
        )}

        <div className="space-y-4">
          {filteredPosts.map((post) => (
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
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {post.status.toUpperCase() === 'RESOLVED' ? 'CLOSED' : post.status.replaceAll('_', ' ')}
                    </span>

                    {/* Delete post option for the author */}
                    {Boolean(
                      user &&
                      user.role === 'CITIZEN' &&
                      (post.authorId === user.id ||
                       (post.authorUsername && user.username && post.authorUsername.toLowerCase() === user.username.toLowerCase()))
                    ) && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                          title="Post options"
                          aria-label="Post options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuPostId === post.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20 cursor-default"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenuPostId(null);
                              }}
                            />
                            <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl z-30 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMenuPostId(null);
                                  setPostToDelete(post);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Post</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clickable Post Content: Click anywhere to open the complaint docket */}
                {(() => {
                  const complaintUrl =
                    user?.role === 'AUTHORITY'
                      ? `/authority/complaints/${post.caseId}?from=posts`
                      : `/ticket/${post.caseId}?from=posts`;
                  const photos = parsePhotoUrls(post.initialPhotoUrl);

                  return (
                    <Link
                      href={complaintUrl}
                      className="block group cursor-pointer space-y-3"
                      title="Click to view complaint details"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                          {post.category}
                        </p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {post.title}
                        </h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {post.description}
                        </p>
                      </div>

                      {/* Attached Pictures: Social Media Style Layout */}
                      {photos.length > 0 && (
                        <div className="pt-1">
                          {photos.length === 1 && (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[400px] w-full">
                              <img
                                src={photos[0]}
                                alt={post.title}
                                className="w-full max-h-[400px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {photos.length === 2 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-200 max-h-[320px]">
                              {photos.map((src, i) => (
                                <div key={i} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                                  <img
                                    src={src}
                                    alt={`${post.title} photo ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {photos.length === 3 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-200 max-h-[340px]">
                              <div className="relative row-span-2 h-full min-h-[220px] bg-slate-100 overflow-hidden">
                                <img
                                  src={photos[0]}
                                  alt={`${post.title} photo 1`}
                                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                              <div className="grid grid-rows-2 gap-2 h-full">
                                {photos.slice(1, 3).map((src, i) => (
                                  <div key={i} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                                    <img
                                      src={src}
                                      alt={`${post.title} photo ${i + 2}`}
                                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {photos.length >= 4 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-200 max-h-[340px]">
                              {photos.slice(0, 4).map((src, i) => (
                                <div key={i} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                                  <img
                                    src={src}
                                    alt={`${post.title} photo ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                    loading="lazy"
                                  />
                                  {i === 3 && photos.length > 4 && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-extrabold text-lg">
                                      +{photos.length - 3}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Location text */}
                      {post.addressDescription && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                          <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="group-hover:text-slate-800 transition-colors">
                            {post.addressDescription}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })()}

                {/* Bottom Row: Post ID on left, Like/Comment/Save small icons on right */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    {post.caseId}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                    {/* Like / Upvote Icon */}
                    {canInteract ? (
                      <button
                        type="button"
                        onClick={() => void toggleReaction(post)}
                        disabled={reactionBusy === post.id}
                        aria-pressed={post.reactedByMe}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          post.reactedByMe
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        }`}
                        title="Support complaint (+1)"
                      >
                        <ThumbsUp className={`h-4 w-4 ${post.reactedByMe ? 'fill-blue-600 text-blue-600' : ''}`} />
                        <span>{post.plusOneCount}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-400">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.plusOneCount}</span>
                      </span>
                    )}

                    {/* Comment Icon */}
                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        expandedComments[post.id]
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      }`}
                      title={expandedComments[post.id] ? 'Hide comments' : 'Comments'}
                    >
                      <MessageCircle className={`h-4 w-4 ${expandedComments[post.id] ? 'fill-blue-600 text-blue-600' : ''}`} />
                      {post.comments.length > 0 && <span>{post.comments.length}</span>}
                    </button>

                    {/* Save Icon */}
                    <button
                      type="button"
                      onClick={() => toggleSavePost(post.id)}
                      className={`inline-flex items-center rounded-xl p-2 text-xs font-bold transition-all cursor-pointer ${
                        savedPostIds.includes(post.id)
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      }`}
                      title={savedPostIds.includes(post.id) ? 'Remove from Saved' : 'Save post'}
                    >
                      <Bookmark className={`h-4 w-4 ${savedPostIds.includes(post.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>
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

        {/* Modal: Confirm Delete Post */}
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Delete Post</h3>
                  <p className="text-xs text-slate-500 font-medium">Case ID: {postToDelete.caseId}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this civic post? This will permanently remove the complaint docket and all its comments. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePost()}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {deleteSuccess && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-bold shadow-xl animate-in slide-in-from-bottom-3 duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{deleteSuccess}</span>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
