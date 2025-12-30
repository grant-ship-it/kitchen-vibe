'use client';

import { useState } from 'react';

// Define types for our recipe data
interface Recipe {
  title: string;
  image: string;
  ingredients: string[];
  instructions: string[] | Array<{ text: string }>;
  description?: string;
  cookTime?: string;
  prepTime?: string;
  yield?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [saveStep, setSaveStep] = useState<'initial' | 'email' | 'success'>('initial');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setRecipe(null);
    setSaveStep('initial');
    setEmail('');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract recipe');
      }

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
      } else {
        throw new Error('No recipe found on this page');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format duration (ISO 8601 to human readable) usually format is PT1H30M
  // Simple parser for display
  const formatDuration = (isoDuration: string) => {
    if (!isoDuration) return null;
    return isoDuration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
  };

  return (
    <main className="min-h-screen py-12 px-4 bg-[var(--background)]">
      <div className="container-custom">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--foreground)]">
            Kitchen<span className="text-[var(--primary)]">Vibe</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Paste a blog link. Get just the recipe. No clutter.
          </p>
        </header>

        {/* Search Input */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://awesomefoodblog.com/best-lasagna"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-6 py-4 rounded-full border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] shadow-sm text-lg bg-white dark:bg-zinc-900 transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-6 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Cooking...' : 'Get Recipe'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-center max-w-xl mx-auto border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
        </div>

        {/* Recipe Display */}
        {recipe && (
          <div className="card shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Recipe Image Header */}
            {recipe.image && (
              <div className="w-full h-64 md:h-80 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={Array.isArray(recipe.image) ? recipe.image[0] : recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-6 md:p-8 text-white">
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight">{recipe.title}</h2>
                    {recipe.yield && <p className="mt-2 text-white/90 font-medium">Yields: {recipe.yield}</p>}
                  </div>
                </div>
              </div>
            )}

            {!recipe.image && (
              <div className="p-8 border-b border-[var(--border)]">
                <h2 className="text-3xl font-bold text-[var(--foreground)]">{recipe.title}</h2>
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Meta Data */}
              <div className="flex flex-wrap gap-4 mb-8 text-sm uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 text-center">
                {recipe.prepTime && (
                  <div className="bg-[var(--accent)] px-4 py-2 rounded-full">
                    Prep: <span className="text-[var(--foreground)]">{formatDuration(recipe.prepTime)}</span>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="bg-[var(--accent)] px-4 py-2 rounded-full">
                    Cook: <span className="text-[var(--foreground)]">{formatDuration(recipe.cookTime)}</span>
                  </div>
                )}
              </div>

              {recipe.description && (
                <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 italic border-l-4 border-[var(--primary)] pl-4">
                  {recipe.description}
                </p>
              )}

              <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                {/* Ingredients */}
                <div className="md:col-span-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--primary)]">
                    Ingredients
                  </h3>
                  <ul className="space-y-3">
                    {recipe.ingredients?.map((ing, i) => (
                      <li key={i} className="pb-3 border-b border-[var(--border)] last:border-0 text-gray-700 dark:text-gray-300 leading-snug">
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div className="md:col-span-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--primary)]">
                    Instructions
                  </h3>
                  <div className="space-y-6">
                    {recipe.instructions?.map((step: any, i: number) => {
                      const text = typeof step === 'string' ? step : step.text;
                      return (
                        <div key={i} className="flex gap-4">
                          <div className="flex-none w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-[var(--primary)] text-sm">
                            {i + 1}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                            {text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Recipe Feature (Teaser) */}
              <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
                {saveStep === 'initial' && (
                  <button
                    onClick={() => setSaveStep('email')}
                    className="px-8 py-3 rounded-full bg-[var(--foreground)] text-white font-semibold hover:opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                    Save Recipe
                  </button>
                )}

                {saveStep === 'email' && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); setSaveStep('success'); }}
                    className="max-w-md mx-auto animate-in fade-in zoom-in duration-300"
                  >
                    <p className="text-[var(--primary)] font-bold mb-4 uppercase tracking-wider text-xs">Join the Waitlist</p>
                    <div className="flex gap-2 p-1 rounded-full border border-[var(--border)] bg-[var(--accent)] shadow-inner">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )}

                {saveStep === 'success' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xl font-bold text-[var(--primary)] mb-1">Coming soon!</p>
                    <p className="text-gray-500 text-sm">We&apos;ll notify <strong>{email}</strong> when the Kitchen Vault is ready.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-gray-400">
          Built with ❤️ by Kitchen Vibe Agent
        </footer>
      </div>
    </main>
  );
}
