import { useEffect, useState } from 'react';
import { Building2, Loader } from 'lucide-react';
import { University } from '../../../types';
import { academicService } from '../../../lib/services/academic.service';
import { Button } from '../ui/button';

interface UniversitySelectorProps {
  value: string;
  onSelect: (universityId: string) => void;
  onNext: () => void;
}

export function UniversitySelector({ value, onSelect, onNext }: UniversitySelectorProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const getUniversityId = (university: any) => university?._id || university?.id || '';

  const normalizedUniversitySearch = universitySearch.trim().toLowerCase();
  const filteredUniversities = universities.filter((university) => {
    if (!normalizedUniversitySearch) return true;
    const name = String(university.name || '').toLowerCase();
    const shortName = String(university.shortName || '').toLowerCase();
    const description = String(university.description || '').toLowerCase();
    return (
      name.includes(normalizedUniversitySearch) ||
      shortName.includes(normalizedUniversitySearch) ||
      description.includes(normalizedUniversitySearch)
    );
  });

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoading(true);
        const data = await academicService.getUniversities();
        setUniversities(data);
      } catch (err) {
        setError('Failed to load universities');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUniversities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select University</h2>
        <p className="text-gray-600">Choose your university to continue</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {universities.length > 0 && (
        <div>
          <input
            type="text"
            value={universitySearch}
            onChange={(event) => setUniversitySearch(event.target.value)}
            placeholder="Search university by name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      )}

      {universities.length > 0 && filteredUniversities.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          No university matches your search.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUniversities.map((university) => (
          <button
            key={getUniversityId(university)}
            onClick={() => onSelect(getUniversityId(university))}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === getUniversityId(university)
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Building2
                className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  value === getUniversityId(university) ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div>
                <p
                  className={`font-semibold ${
                    value === getUniversityId(university) ? 'text-green-700' : 'text-gray-900'
                  }`}
                >
                  {university.name}
                </p>
                {university.shortName && (
                  <p className="text-sm text-gray-500">{university.shortName}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!value}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        Continue
      </Button>
    </div>
  );
}
