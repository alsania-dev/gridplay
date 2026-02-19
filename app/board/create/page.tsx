'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const sports = [
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nhl', label: 'NHL' },
  { value: 'ncaa', label: 'NCAA Football' },
  { value: 'ncaa-basketball', label: 'NCAA Basketball' },
];

const boardTypes = [
  { value: '5x5', label: '5x5 Grid', description: '25 squares - Quick games' },
  { value: '10x10', label: '10x10 Grid', description: '100 squares - Classic format' },
  { value: 'shotgun', label: 'Shotgun Board', description: '2 rows - Fast-paced action' },
];

const priceOptions = [
  { value: '1', label: '$1 per square' },
  { value: '5', label: '$5 per square' },
  { value: '10', label: '$10 per square' },
  { value: '25', label: '$25 per square' },
  { value: 'custom', label: 'Custom amount' },
];

export default function CreateBoardPage() {
  const [formData, setFormData] = useState({
    boardName: '',
    sport: '',
    boardType: '',
    squarePrice: '',
    customPrice: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating board:', formData);
    // TODO: Implement board creation
  };

  return (
    <div className="min-h-screen bg-navy-900 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Create a <span className="text-primary-500">Board</span>
          </h1>
          <p className="text-gray-400">
            Set up your sports squares board and invite friends to play.
          </p>
        </div>

        {/* Form */}
        <Card className="bg-navy-800/50 border-navy-700">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Board Name */}
              <Input
                label="Board Name"
                placeholder="e.g., Super Bowl LVIII Party"
                value={formData.boardName}
                onChange={(e) => setFormData({ ...formData, boardName: e.target.value })}
                required
              />

              {/* Sport Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Sport
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  required
                >
                  <option value="">Select a sport</option>
                  {sports.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Board Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Board Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {boardTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${formData.boardType === type.value
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-border hover:border-primary-500/50 hover:bg-white/5'
                        }
                      `}
                      onClick={() => setFormData({ ...formData, boardType: type.value })}
                    >
                      <div className="font-semibold text-white">{type.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Square Price */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Square Price
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  value={formData.squarePrice}
                  onChange={(e) => setFormData({ ...formData, squarePrice: e.target.value })}
                  required
                >
                  <option value="">Select price per square</option>
                  {priceOptions.map((price) => (
                    <option key={price.value} value={price.value}>
                      {price.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Price */}
              {formData.squarePrice === 'custom' && (
                <Input
                  label="Custom Price"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.customPrice}
                  onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                  hint="Enter the price per square in dollars"
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="w-full sm:w-auto">
                <Button type="button" variant="ghost" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1">
                Create Board
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
