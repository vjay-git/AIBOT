import React, { useState, useEffect } from 'react';
import { CardData, ChartType } from './types';

interface AddEditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<CardData>) => void;
  editData?: CardData;
}

const chartTypeOptions: { value: ChartType; label: string }[] = [
  { value: 'pie', label: 'Pie Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'text', label: 'Text' },
];

const AddEditCardModal: React.FC<AddEditCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
}) => {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [content, setContent] = useState<any>({});

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setChartType(editData.type);
      setContent(editData.content);
    } else {
      // Default values for new card
      setTitle('New Chart');
      setChartType('bar');
      resetContent('bar');
    }
  }, [editData, isOpen]);

  const resetContent = (type: ChartType) => {
    switch (type) {
      case 'pie':
        setContent({
          values: [40, 30, 20, 10],
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
        });
        break;
      case 'bar':
      case 'line':
      case 'scatter':
        setContent({
          x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          y: [10, 23, 15, 35, 27],
        });
        break;
      case 'text':
        setContent({ text: 'Enter your text here...' });
        break;
    }
  };

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ChartType;
    setChartType(newType);
    resetContent(newType);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (chartType === 'text') {
      setContent({ text: e.target.value });
    } else {
      try {
        setContent(JSON.parse(e.target.value));
      } catch (error) {
        // Handle invalid JSON
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      type: chartType,
      content,
      ...(editData ? { id: editData.id } : {}),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {editData ? 'Edit Chart' : 'Add New Chart'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={handleChartTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {chartTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              {chartType === 'text' ? 'Text Content' : 'Chart Data'}
            </label>
            <textarea
              value={
                chartType === 'text'
                  ? content.text || ''
                  : JSON.stringify(content, null, 2)
              }
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 font-mono text-sm"
              required
            />
            {chartType !== 'text' && (
              <p className="text-xs text-gray-500 mt-1">
                Enter chart data in JSON format
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCardModal;