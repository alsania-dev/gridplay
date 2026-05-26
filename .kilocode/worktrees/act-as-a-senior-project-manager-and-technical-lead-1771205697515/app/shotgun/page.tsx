'use client';

import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { BoardHeader } from '../components/board/BoardHeader';
import { ShotgunBoard, ShotgunSquare } from '../components/board/ShotgunBoard';

// Demo data
const demoRow1: ShotgunSquare[] = [
  { id: 'r1-0', number: 7, owner: 'John' },
  { id: 'r1-1', number: 3 },
  { id: 'r1-2', number: 0, owner: 'Sarah' },
  { id: 'r1-3', number: 4 },
  { id: 'r1-4', number: 9, owner: 'Mike', isWinner: true },
  { id: 'r1-5', number: 1 },
  { id: 'r1-6', number: 6, owner: 'Lisa' },
  { id: 'r1-7', number: 2 },
  { id: 'r1-8', number: 8, owner: 'Tom' },
  { id: 'r1-9', number: 5 },
];

const demoRow2: ShotgunSquare[] = [
  { id: 'r2-0', number: 2, owner: 'Amy' },
  { id: 'r2-1', number: 8 },
  { id: 'r2-2', number: 5, owner: 'Dave' },
  { id: 'r2-3', number: 1 },
  { id: 'r2-4', number: 7, owner: 'Jen' },
  { id: 'r2-5', number: 3 },
  { id: 'r2-6', number: 9, owner: 'Bob' },
  { id: 'r2-7', number: 4 },
  { id: 'r2-8', number: 0, owner: 'Kim' },
  { id: 'r2-9', number: 6 },
];

export default function ShotgunPage() {
  const [row1Squares, setRow1Squares] = useState<ShotgunSquare[]>(demoRow1);
  const [row2Squares, setRow2Squares] = useState<ShotgunSquare[]>(demoRow2);

  const handleSquareClick = (squareId: string) => {
    console.log('Square clicked:', squareId);
    // TODO: Implement square selection
  };

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            <span className="text-primary-500">Shotgun</span> Board
          </h1>
          <p className="text-gray-400">
            Fast-paced action with two rows of numbers
          </p>
        </div>

        {/* Game Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <BoardHeader
            homeTeam="Chiefs"
            awayTeam="49ers"
            homeScore={24}
            awayScore={21}
            quarter="Q3"
            timeRemaining="8:42"
          />
        </div>

        {/* Shotgun Board */}
        <Card className="max-w-3xl mx-auto bg-navy-800/50 border-navy-700 mb-8">
          <CardContent className="py-8">
            <ShotgunBoard
              row1Squares={row1Squares}
              row2Squares={row2Squares}
              row1Label="Row 1 - Away Team Last Digit"
              row2Label="Row 2 - Home Team Last Digit"
              onSquareClick={handleSquareClick}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="max-w-3xl mx-auto">
          <Card className="bg-navy-800/30 border-navy-700">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary-500/30 border border-primary-500" />
                  <span className="text-gray-400">Winner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-navy-700/50 border border-navy-600" />
                  <span className="text-gray-400">Owned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-surface/50 border border-border" />
                  <span className="text-gray-400">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline">
            Share Board
          </Button>
          <Button>
            Pick a Square
          </Button>
        </div>
      </div>
    </div>
  );
}
