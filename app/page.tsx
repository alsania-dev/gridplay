import Link from 'next/link';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Multiple Board Types',
    description: 'Choose from 5x5, 10x10 grids, or our unique Shotgun board for any game.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Play with Friends',
    description: 'Create private boards and invite friends for a personalized experience.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Score Updates',
    description: 'Real-time score tracking keeps your board current throughout the game.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Automatic Payouts',
    description: 'Winners are calculated automatically at the end of each quarter.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Create or Join',
    description: 'Start a new board or join an existing one with a simple code.',
  },
  {
    step: 2,
    title: 'Pick Your Squares',
    description: 'Select your lucky squares on the grid before the game starts.',
  },
  {
    step: 3,
    title: 'Watch & Win',
    description: 'Numbers are assigned randomly. Watch the game and track your squares!',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 py-20 sm:py-32">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" style={{ backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">Your Grid. </span>
              <span className="text-gradient">Their Game.</span>
              <br />
              <span className="text-primary-500">Instant Glory.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              The ultimate digital platform for sports squares. Create boards, invite friends, 
              and track scores in real-time for Super Bowl, March Madness, and more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/board/create">
                <Button size="lg" className="w-full sm:w-auto">
                  Create a Board
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Button>
              </Link>
              <Link href="/board/join">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Join a Board
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-navy-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need for Game Day
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              GridPlay brings the classic sports squares experience into the digital age with 
              powerful features for hosts and players alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} hover className="bg-navy-800/50 border-navy-700">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-500 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-navy-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Getting started with GridPlay is simple. Create or join a board in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-navy-900 text-2xl font-bold mb-4 shadow-glow">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">
                    {item.description}
                  </p>
                </div>
                {item.step < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-navy-800 to-navy-800/50 border-primary-500/20 max-w-4xl mx-auto">
            <div className="text-center py-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Start Playing?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of players who have already discovered the modern way to enjoy sports squares.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/board/create">
                  <Button size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/shotgun">
                  <Button variant="ghost" size="lg">
                    Try Shotgun Board
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Sports Supported */}
      <section className="py-16 bg-navy-800/20 border-t border-navy-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-6">SUPPORTED SPORTS</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {['NFL', 'NBA', 'MLB', 'NHL', 'NCAA'].map((sport) => (
                <span
                  key={sport}
                  className="text-xl sm:text-2xl font-bold text-gray-600 hover:text-primary-500 transition-colors cursor-default"
                >
                  {sport}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
