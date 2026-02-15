import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, Loader, Filter, BookOpen, GraduationCap } from 'lucide-react';
import { searchService } from '../../lib/services/search.service';
import type { Question, Topic, Course } from '../../types';

export function AdvancedSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  const [searchType, setSearchType] = useState<'all' | 'questions' | 'topics'>('all');

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['advanced-search', query, difficulty, searchType],
    queryFn: async () => {
      if (searchType === 'topics') {
        return await searchService.searchTopics({ q: query });
      } else if (searchType === 'questions') {
        return await searchService.advancedSearch({ q: query, difficulty: difficulty as any });
      } else {
        return await searchService.globalSearch(query);
      }
    },
    enabled: query.length > 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      );
    }

    if (!searchResults || query.length < 3) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Enter at least 3 characters to search</p>
        </div>
      );
    }

    if (searchType === 'questions' && 'data' in searchResults) {
      const questions = (searchResults as any).data || [];
      return (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No questions found</p>
          ) : (
            questions.map((q: any) => (
              <div
                key={q.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 cursor-pointer transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{q.question}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {q.difficulty}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {q.courseId}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (searchType === 'topics' && 'data' in searchResults) {
      const topics = (searchResults as any).data || [];
      return (
        <div className="space-y-4">
          {topics.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No topics found</p>
          ) : (
            topics.map((t: any) => (
              <div
                key={t.id}
                onClick={() => navigate(`/topics/${t.id}`)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md cursor-pointer transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{t.courseName}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t.questionsCount} questions</span>
                  <GraduationCap className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (searchType === 'all' && 'universities' in (searchResults as any)) {
      const results = searchResults as any;
      return (
        <div className="space-y-8">
          {/* Universities */}
          {results.universities?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Universities</h3>
              <div className="grid gap-4">
                {results.universities.map((uni: any) => (
                  <div key={uni.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{uni.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {results.departments?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Departments</h3>
              <div className="grid gap-4">
                {results.departments.map((dept: any) => (
                  <div key={dept.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {results.courses?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses</h3>
              <div className="grid gap-4">
                {results.courses.map((course: any) => (
                  <div key={course.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{course.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {results.topics?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics</h3>
              <div className="grid gap-4">
                {results.topics.map((topic: any) => (
                  <div key={topic.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">
            Search across universities, departments, courses, topics, and questions
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search term..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Results</option>
                  <option value="questions">Questions Only</option>
                  <option value="topics">Topics Only</option>
                </select>
              </div>

              {searchType === 'questions' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Results */}
        {renderResults()}
      </div>
    </Layout>
  );
}
