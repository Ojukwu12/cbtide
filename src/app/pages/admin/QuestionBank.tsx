import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Brain,
  BookOpen,
  AlertCircle,
  Plus,
  Upload,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
  id: number;
  question: string;
  course: string;
  topic: string;
  difficulty: Difficulty;
  source: 'ai' | 'manual';
  createdDate: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export function QuestionBank() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const questions: Question[] = [
    {
      id: 1,
      question: 'What is the time complexity of binary search algorithm?',
      course: 'Computer Science 301',
      topic: 'Algorithms',
      difficulty: 'medium',
      source: 'ai',
      createdDate: '2026-02-09',
      options: [
        { id: 'A', text: 'O(n)' },
        { id: 'B', text: 'O(log n)' },
        { id: 'C', text: 'O(n²)' },
        { id: 'D', text: 'O(1)' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 2,
      question: 'Which data structure uses LIFO (Last In First Out) principle?',
      course: 'Computer Science 301',
      topic: 'Data Structures',
      difficulty: 'easy',
      source: 'ai',
      createdDate: '2026-02-08',
      options: [
        { id: 'A', text: 'Queue' },
        { id: 'B', text: 'Stack' },
        { id: 'C', text: 'Array' },
        { id: 'D', text: 'Linked List' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 3,
      question: 'What does OOP stand for in programming?',
      course: 'Computer Science 301',
      topic: 'OOP',
      difficulty: 'easy',
      source: 'manual',
      createdDate: '2026-02-07',
      options: [
        { id: 'A', text: 'Object Oriented Programming' },
        { id: 'B', text: 'Order Of Precedence' },
        { id: 'C', text: 'Optimal Output Processing' },
        { id: 'D', text: 'Organized Operation Pattern' }
      ],
      correctAnswer: 'A'
    },
    {
      id: 4,
      question: 'In database normalization, what is the primary goal of 3NF?',
      course: 'Computer Science 301',
      topic: 'Databases',
      difficulty: 'hard',
      source: 'ai',
      createdDate: '2026-02-10',
      options: [
        { id: 'A', text: 'Eliminate transitive dependencies' },
        { id: 'B', text: 'Remove partial dependencies' },
        { id: 'C', text: 'Ensure atomic values' },
        { id: 'D', text: 'Create foreign keys' }
      ],
      correctAnswer: 'A'
    },
    {
      id: 5,
      question: 'Which sorting algorithm has the best average time complexity?',
      course: 'Computer Science 301',
      topic: 'Algorithms',
      difficulty: 'medium',
      source: 'manual',
      createdDate: '2026-02-06',
      options: [
        { id: 'A', text: 'Bubble Sort' },
        { id: 'B', text: 'Quick Sort' },
        { id: 'C', text: 'Selection Sort' },
        { id: 'D', text: 'Insertion Sort' }
      ],
      correctAnswer: 'B'
    },
  ];

  const courses = ['all', ...Array.from(new Set(questions.map(q => q.course)))];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesCourse = filterCourse === 'all' || q.course === filterCourse;
    return matchesSearch && matchesDifficulty && matchesCourse;
  });

  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

  const handleGenerateQuestions = () => {
    if (!aiPrompt.trim() && !selectedFile) {
      alert('Please provide a prompt or attach study materials');
      return;
    }
    alert(`Generating questions from ${selectedFile ? 'uploaded materials' : 'prompt'}...`);
    setShowAIGenerator(false);
    setAiPrompt('');
    setSelectedFile(null);
  };

  const handleDeleteQuestion = (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      alert(`Question ${id} deleted!`);
    }
  };

  const handleEditQuestion = (id: number) => {
    alert(`Editing question ${id}...`);
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-blue-100 text-blue-700';
      case 'medium':
        return 'bg-purple-100 text-purple-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank</h1>
            <p className="text-gray-600">Manage and generate exam questions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Brain className="w-5 h-5" />
              AI Generate
            </button>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
        </div>

        {/* AI Generator Panel */}
        {showAIGenerator && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Question Generator</h2>
                <p className="text-gray-600">Generate questions from prompts or study materials</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course & Topic
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="e.g., Computer Science 301"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Prompt (Optional)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what kind of questions you want... e.g., 'Generate 10 medium difficulty questions about binary trees and tree traversal algorithms'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Study Materials (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedFile ? selectedFile.name : 'Drop files here or click to upload'}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT up to 10MB</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    min={1}
                    max={50}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Mixed</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Multiple Choice</option>
                    <option>True/False</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateQuestions}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Questions
                </button>
                <button
                  onClick={() => setShowAIGenerator(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Question Form */}
        {showManualForm && (
          <div className="bg-white rounded-xl border-2 border-green-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Question Manually</h2>
                <p className="text-gray-600">Create a new exam question</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science 301"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <textarea
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {option}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter option ${option}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    alert('Question added successfully!');
                    setShowManualForm(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Save Question
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Questions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.easy}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Medium</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.medium}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Hard</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.hard}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
              >
                {courses.map(course => (
                  <option key={course} value={course}>
                    {course === 'all' ? 'All Courses' : course}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
              >
                <option value="all">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(question.difficulty)}`}>
                      {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                    </span>
                    {question.source === 'ai' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        AI Generated
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {question.question}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{question.course}</span>
                    <span>•</span>
                    <span>{question.topic}</span>
                    <span>•</span>
                    <span>{question.createdDate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditQuestion(question.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit question"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-lg border-2 ${
                      option.id === question.correctAnswer
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        option.id === question.correctAnswer ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {option.id}.
                      </span>
                      <span className={option.id === question.correctAnswer ? 'text-green-700' : 'text-gray-900'}>
                        {option.text}
                      </span>
                      {option.id === question.correctAnswer && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowAIGenerator(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Brain className="w-5 h-5" />
                Generate with AI
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}