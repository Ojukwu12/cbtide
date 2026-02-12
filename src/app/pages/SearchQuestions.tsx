import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, BookOpen, ChevronRight, Filter } from 'lucide-react';
import { questionService } from '../../lib/services/question.service';
import type { Question } from '../../types';

export function SearchQuestions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search-questions', searchTerm],
    queryFn: () => questionService.searchQuestions({ query: searchTerm }),
    enabled: searchTerm.length > 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length > 2) {
      refetch();
    }
  };

  const filteredQuestions = (data as any)?.questions?.filter((q: any) => {
    if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
    if (selectedType && q.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Questions</h1>
          <p className="text-gray-600">Find questions by keyword, topic, or difficulty</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by question text, topic, or keyword..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={searchTerm.length < 3}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDifficulty('');
                  setSelectedType('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : !searchTerm ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Searching</h3>
            <p className="text-gray-600">Enter at least 3 characters to search for questions</p>
          </div>
        ) : !filteredQuestions || filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                Found <span className="font-semibold">{filteredQuestions.length}</span> question(s)
              </p>
            </div>
            {filteredQuestions.map((question: any) => (
              <div
                key={question._id || question.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : question.difficulty === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {question.type || 'Multiple Choice'}
                      </span>
                      {question.topic && (
                        <span className="text-sm text-gray-600">
                          {question.topic.name || question.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-3">
                      {question.text}
                    </p>
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2">
                        {question.options.map((option: any) => (
                          <div
                            key={option._id}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium">
                              {option.text.charAt(0)}
                            </span>
                            {option.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
