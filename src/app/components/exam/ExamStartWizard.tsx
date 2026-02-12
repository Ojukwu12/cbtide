import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Loader, FileText, Clock, BookOpen, ChevronLeft, ArrowRight } from 'lucide-react';
import { Topic } from '../../../types';
import { examService } from '../../../lib/services/exam.service';
import { academicService } from '../../../lib/services/academic.service';
import { Button } from '../ui/button';
import { UniversitySelector } from './UniversitySelector';
import { DepartmentSelector } from './DepartmentSelector';
import { CourseSelector } from './CourseSelector';

type WizardStep = 'university' | 'department' | 'course' | 'config';

interface WizardState {
  universityId: string;
  departmentId: string;
  courseId: string;
  examType: 'practice' | 'mock' | 'final';
  totalQuestions: number;
  durationMinutes: number;
  topicIds: string[];
}

export function ExamStartWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>(() => {
    // Pre-select last used university if available
    return user?.lastSelectedUniversityId ? 'department' : 'university';
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [wizard, setWizard] = useState<WizardState>({
    universityId: user?.lastSelectedUniversityId || '',
    departmentId: user?.lastSelectedDepartmentId || '',
    courseId: user?.lastSelectedCourseId || '',
    examType: 'practice',
    totalQuestions: 20,
    durationMinutes: 30,
    topicIds: [],
  });

  // Load topics when course changes
  useEffect(() => {
    const loadTopics = async () => {
      if (!wizard.courseId) {
        setTopics([]);
        return;
      }

      try {
        setLoadingTopics(true);
        const data = await academicService.getTopics(wizard.courseId);
        setTopics(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        // Reset selected topics when course changes
        setWizard((prev) => ({ ...prev, topicIds: [] }));
      } catch (err) {
        console.error('Failed to load topics:', err);
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [wizard.courseId]);

  const handleStartExam = async () => {
    if (!wizard.universityId || !wizard.departmentId || !wizard.courseId) {
      toast.error('Please complete all selections');
      return;
    }

    try {
      setSubmitting(true);
      // When starting an exam, backend /api/exams/start endpoint will:
      // 1. Fetch questions for the selected topic(s)
      // 2. Filter to only APPROVED questions (approved: true)
      // 3. Exclude pending/unapproved questions (approved: false)
      // This ensures students only see approved questions in exams
      const response = await examService.startExam({
        universityId: wizard.universityId,
        departmentId: wizard.departmentId,
        courseId: wizard.courseId,
        examType: wizard.examType,
        totalQuestions: wizard.totalQuestions,
        durationMinutes: wizard.durationMinutes,
        topicIds: wizard.topicIds.length > 0 ? wizard.topicIds : undefined,
      });

      toast.success('Exam started successfully');
      navigate(`/exams/${response.id}/in-progress`);
    } catch (err) {
      console.error('Failed to start exam:', err);
      toast.error('Failed to start exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setWizard((prev) => ({
      ...prev,
      topicIds: prev.topicIds.includes(topicId)
        ? prev.topicIds.filter((id) => id !== topicId)
        : [...prev.topicIds, topicId],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start New Exam</h1>
        <p className="text-gray-600">
          {step === 'university' && 'Step 1: Select your university'}
          {step === 'department' && 'Step 2: Select your department'}
          {step === 'course' && 'Step 3: Select your course'}
          {step === 'config' && 'Step 4: Configure your exam'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 flex items-center gap-2">
        {(['university', 'department', 'course', 'config'] as const).map(
          (s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step === s || (['university', 'department', 'course', 'config'].indexOf(step) >= idx)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
              {idx < 3 && <div className="w-2" />}
            </div>
          )
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {step === 'university' && (
          <UniversitySelector
            value={wizard.universityId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, universityId: id }))}
            onNext={() => setStep('department')}
          />
        )}

        {step === 'department' && (
          <DepartmentSelector
            universityId={wizard.universityId}
            value={wizard.departmentId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, departmentId: id }))}
            onNext={() => setStep('course')}
            onBack={() => setStep('university')}
          />
        )}

        {step === 'course' && (
          <CourseSelector
            departmentId={wizard.departmentId}
            value={wizard.courseId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, courseId: id }))}
            onNext={() => setStep('config')}
            onBack={() => setStep('department')}
          />
        )}

        {step === 'config' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Exam</h2>
              <p className="text-gray-600">Customize your exam settings</p>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Exam Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['practice', 'mock', 'final'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWizard((prev) => ({ ...prev, examType: type }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      wizard.examType === type
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText
                      className={`w-6 h-6 mb-2 mx-auto ${
                        wizard.examType === type ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`font-medium capitalize ${
                        wizard.examType === type ? 'text-green-700' : 'text-gray-700'
                      }`}
                    >
                      {type}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label htmlFor="questions" className="block text-sm font-semibold text-gray-900 mb-3">
                Number of Questions: {wizard.totalQuestions}
              </label>
              <input
                id="questions"
                type="range"
                min="5"
                max="100"
                step="5"
                value={wizard.totalQuestions}
                onChange={(e) =>
                  setWizard((prev) => ({
                    ...prev,
                    totalQuestions: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>5 questions</span>
                <span>100 questions</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 mb-3">
                <Clock className="inline w-4 h-4 mr-2" />
                Duration: {wizard.durationMinutes} minutes
              </label>
              <input
                id="duration"
                type="range"
                min="15"
                max="180"
                step="15"
                value={wizard.durationMinutes}
                onChange={(e) =>
                  setWizard((prev) => ({
                    ...prev,
                    durationMinutes: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>15 min</span>
                <span>3 hours</span>
              </div>
            </div>

            {/* Topics */}
            {loadingTopics ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            ) : topics.length > 0 ? (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  <BookOpen className="inline w-4 h-4 mr-2" />
                  Topics (Optional - Leave blank for all)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topics.map((topic) => (
                    <label key={topic.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizard.topicIds.includes(topic.id)}
                        onChange={() => handleTopicToggle(topic.id)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                        {topic.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setStep('course')}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartExam}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
