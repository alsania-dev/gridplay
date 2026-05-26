/**
 * GridPlay Home Page
 * 
 * Landing page with hero section, featured games, and how it works.
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { GameCard } from '../components/GameCard';
import { listGames } from '../lib/api';
import { GAME_MODES, BOARD_STATUS, THEME_COLORS } from '../lib/constants';
import type { BoardListItem } from '../types';

// Default navigation items
const defaultNavItems = [
  { label: 'Games', href: '/games' },
  { label: 'Create', href: '/create-board' },
  { label: 'Join', href: '/join-board' },
];

// Featured game modes for the home page
const featuredModes = [
  {
    mode: GAME_MODES.SHOTGUN,
    title: 'Shotgun',
    description: 'Fast-paced linear game. First to claim wins!',
    icon: '🎯',
    href: '/shotgun',
  },
  {
    mode: GAME_MODES.FIVE_BY_FIVE,
    title: '5x5 Grid',
    description: 'Classic 25-cell grid with quarter payouts.',
    icon: '🏈',
    href: '/game?mode=5x5',
  },
  {
    mode: GAME_MODES.TEN_BY_TEN,
    title: '10x10 Grid',
    description: 'Traditional 100-cell football squares.',
    icon: '🏆',
    href: '/game?mode=10x10',
  },
];

// How it works steps
const howItWorksSteps = [
  {
    step: 1,
    title: 'Choose a Game',
    description: 'Select from Shotgun, 5x5, or classic 10x10 football squares.',
    icon: '🎮',
  },
  {
    step: 2,
    title: 'Claim Your Cells',
    description: 'Pick your lucky numbers before the game starts.',
    icon: '✨',
  },
  {
    step: 3,
    title: 'Watch & Win',
    description: 'Scores update in real-time. Match the digits to win!',
    icon: '🎉',
  },
];

export interface HomePageProps {
  /** Featured games to display */
  featuredGames?: BoardListItem[];
}

export const getServerSideProps = async () => {
  try {
    const result = await listGames(BOARD_STATUS.OPEN, 6);
    
    return {
      props: {
        featuredGames: result.success ? result.data : [],
      },
    };
  } catch (error) {
    return {
      props: {
        featuredGames: [],
      },
    };
  }
};

const HomePage: React.FC<HomePageProps> = ({ featuredGames = [] }) => {
  return (
    <>
      <Head>
        <title>GridPlay - Digital Sports Squares</title>
        <meta 
          name="description" 
          content="Play digital football squares with friends. Choose from Shotgun, 5x5, or 10x10 grids. Real-time scoring and instant payouts." 
        />
        <meta property="og:title" content="GridPlay - Digital Sports Squares" />
        <meta property="og:description" content="Play digital football squares with friends. Real-time scoring and instant payouts." />
      </Head>

      <Layout navItems={defaultNavItems}>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background gradient */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              background: `radial-gradient(ellipse at center, ${THEME_COLORS.PRIMARY}15 0%, transparent 70%)`,
            }}
          />
          
          {/* Animated grid background */}
          <div className="absolute inset-0 z-0 opacity-10">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(${THEME_COLORS.PRIMARY}40 1px, transparent 1px),
                  linear-gradient(90deg, ${THEME_COLORS.PRIMARY}40 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            {/* Logo/Title */}
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{ color: THEME_COLORS.PRIMARY }}
            >
              GridPlay
            </h1>
            
            <p className="text-xl md:text-2xl text-[#9CA3AF] mb-8 max-w-2xl mx-auto">
              Digital sports squares for the modern fan. 
              Play with friends, track scores in real-time, and win big.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-board" passHref legacyBehavior>
                <Button size="lg" variant="primary">
                  Create a Game
                </Button>
              </Link>
              <Link href="/join-board" passHref legacyBehavior>
                <Button size="lg" variant="outline">
                  Join a Game
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div>
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-[#9CA3AF]">Games Played</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">$50K+</div>
                <div className="text-sm text-[#9CA3AF]">Won by Players</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">5K+</div>
                <div className="text-sm text-[#9CA3AF]">Active Players</div>
              </div>
            </div>
          </div>
        </section>

        {/* Game Modes Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
              Choose Your Game
            </h2>
            <p className="text-center text-[#9CA3AF] mb-12 max-w-2xl mx-auto">
              Three exciting ways to play. Each game mode offers unique thrills and winning opportunities.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredModes.map((mode) => (
                <Link 
                  key={mode.mode}
                  href={mode.href}
                  className="group"
                >
                  <div 
                    className="p-6 rounded-lg border border-[#374151] bg-[#1A1A1A] 
                               transition-all duration-300 hover:border-[#10B981] 
                               hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <div className="text-4xl mb-4">{mode.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#10B981] transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-[#9CA3AF]">{mode.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Games Section */}
        {featuredGames.length > 0 && (
          <section className="py-20 px-4 bg-[#0A0A0A]">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                Featured Games
              </h2>
              <p className="text-center text-[#9CA3AF] mb-12">
                Join an active game and start playing now.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game}
                    href={`/game/${game.id}`}
                  />
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/games" passHref legacyBehavior>
                  <Button variant="ghost">View All Games</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
              How It Works
            </h2>
            <p className="text-center text-[#9CA3AF] mb-12 max-w-2xl mx-auto">
              Getting started is easy. Create or join a game in minutes.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1E3A5A] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div 
                    className="text-sm font-bold mb-2"
                    style={{ color: THEME_COLORS.PRIMARY }}
                  >
                    Step {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#9CA3AF]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div 
            className="max-w-4xl mx-auto text-center p-12 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${THEME_COLORS.SECONDARY}40 0%, ${THEME_COLORS.PRIMARY}20 100%)`,
              border: `1px solid ${THEME_COLORS.PRIMARY}40`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Play?
            </h2>
            <p className="text-[#9CA3AF] mb-8 max-w-xl mx-auto">
              Create your first game and invite friends. It's free to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-board" passHref legacyBehavior>
                <Button size="lg" variant="primary">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default HomePage;