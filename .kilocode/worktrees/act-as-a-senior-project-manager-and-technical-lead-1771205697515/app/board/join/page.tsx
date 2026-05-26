'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export default function JoinBoardPage() {
  const [boardCode, setBoardCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Joining board:', { boardCode, playerName });
    // TODO: Implement board joining
  };

  return (
    <div className="min-h-screen bg-navy-900 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Join a <span className="text-primary-500">Board</span>
          </h1>
          <p className="text-gray-400">
            Enter the board code shared with you to join and pick your squares.
          </p>
        </div>

        {/* Form */}
        <Card className="bg-navy-800/50 border-navy-700">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Board Code */}
              <Input
                label="Board Code"
                placeholder="Enter 6-digit code"
                value={boardCode}
                onChange={(e) => setBoardCode(e.target.value.toUpperCase())}
                required
                hint="The host will provide this code"
                className="text-center text-2xl tracking-widest uppercase"
                maxLength={6}
              />

              {/* Player Name */}
              <Input
                label="Your Name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                hint="This will be shown on your squares"
              />
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="w-full sm:w-auto">
                <Button type="button" variant="ghost" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1">
                Join Board
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have a code?{' '}
            <Link href="/board/create" className="text-primary-500 hover:text-primary-400">
              Create your own board
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
