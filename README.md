# GridPlay

"Your Grid. Their Game. Instant Glory."
Digital Sports Squares Made Easy, Fair, and Fun!
Ready to revolutionize sports squares? Launch your GridPlay board today—no spreadsheets, no stress, just wins!

## Elevator Pitch:
Tired of messy spreadsheets, cash piles, and manual score-checking for your sports squares game? GridPlay automates the classic sports betting experience, turning chaotic paper grids into sleek, real-time digital boards. Host or join games in seconds, buy squares securely, and let the app handle live scores, random number assignments, and instant payouts—perfect for Super Bowl parties, March Madness, or casual game nights!

## How It Works:
1. **Create or Join a Board**
   - Choose an upcoming sports game. The system will automatically assign the playing teams on the board.
   - Choose from Shotgun Boards (Halftime and Final), 10x10 (classic 100 squares), or 5x5 (25 square mini-grid).
   - Choose or Set squares value (each board will have squares the same value, this 5x5 board is $1 per square. this 5x5 board is $5 per square, etc.) and for premium users, set your house cut (default 10%).

2. **Buy Squares Digitally**
   - Users claim squares via Stripe, PayPal, or crypto.
   - Squares are marked instantly with their username—no duplicates!

3. **Auto-Assign Numbers**
   - After squares sell out, the app randomly assigns 0-9 digits to rows/columns (ensuring fairness).

4. **Track Scores Live**
   - Integrates with ESPN/SportsRadar APIs to auto-update scores by quarter/halftime/final.
   - Winners are highlighted in real time.

5. **Win & Cash Out Instantly**
   - Payouts split by quarter (e.g., 16% for Q1, 24% for halftime).
   - Winnings go straight to users’ wallets or bank accounts.

## Game Modes:
1. **Shotgun Board (2-Row Quick Play)**
   - Top row = Halftime, Bottom row = Final Score.
   - Last digit of each teams score added wins (e.g., 23-17 → 3+7=10 → 0 wins).
   - Payout: 90% of the total pot for that row (Halftime and Final). Example: $1 per square pays $9 to halftime winner and $9 to final winner, house cut 10% ($2).

2. **Classic 10x10 & 5x5 Grids**
   - 10x10: Match column (home team) and row (visitors) digits for each quarter.
   - 5x5: Double digits per row/column for faster action.
   - Each square has a chance to win in all 4 quarters. Your square could win them all.
   - Payouts: 16% (Q1), 24% (halftime), 16% (Q3), 32% (final), 12% house.

## Core Features:
- **Real-Time Updates**: Live scores, sold squares, and winners update automatically – you don't have to lift a finger!
- **Secure Payments**: PCI-compliant gateways (Stripe, PayPal) + crypto options.
- **Social Integration**: Invite friends to a board your playing, or make a private board for social events.
- **Mobile-First Design**: Play on any device—no app download needed.
- **Fair Randomization**: Transparent RNG for number assignments.
- **User Profiles**: Track wins, balance, and game history.
- **"Board Rooms"**: Chat rooms that square holders of the same board can chat together.

## Premium User Benefits:
- Keep and adjust house cut and adjust payout percentage
- Customizable board designs, including branded themes, logos, team colors and more.
- Multi-board management
- Personalized alerts (squares left needing to sell before game starts, board sells out, etc.)
- Access to beta features (early access to upcoming tools or enhancements, such as new game modes or integrations with additional sports data feeds.)

## Why Users Love It:
- **Zero Hassle**: No cash, paper, or math—just pure fun.
- **Equal Chance**: Luck-based (no sports knowledge needed).
- **Social Buzz**: Perfect for watch parties, bars, or online groups.
- **Instant Payouts**: No waiting for hosts to Venmo you.

## Use Cases:
- **Super Bowl, NBA Championship, Finals, March Madness, college, and other sports events**: Fill boards in minutes.
- **Group Events/Parties**: Social gatherings such as office parties, family reunions, or informal meet-ups
- **Bars/Restaurant/Event Hosts**: Looking to draw in, retain, and engage customers during live sports games.
- **Virtual Watch-Alongs**: Remote friends can play together.
- **Influencers/Content Creators/Streamers**: Host branded games for audiences.

## Technical Edge
- **APIs**: Live scores via ESPN/SportsRadar.
- **Security**: End-to-end encryption, GDPR compliance.
- **Scalability**: Handles 10,000+ concurrent users.

## Status Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen.svg)]()

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript 5.7, Tailwind CSS, Chakra UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Payments**: Stripe, PayPal, Crypto
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel (recommended)

## Setup Instructions

### Prerequisites
- Node.js
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GridPlay.git
   cd GridPlay
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.io/).
   - Copy the API URL and public anon key from your Supabase project settings.

4. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
├── components/__tests__/
│   ├── Button.test.tsx      # Button component tests
│   └── GridCell.test.tsx    # GridCell component tests
├── hooks/__tests__/
│   ├── useTimer.test.ts     # Timer hook tests
│   └── useGameBoard.test.ts # Game board hook tests
└── pages/api/__tests__/
    ├── games.test.ts        # Games API endpoint tests
    └── games/[id].test.ts   # Game by ID API tests
```

### Test Coverage

The test suite covers:
- **Unit Tests**: Component rendering, hook logic, utility functions
- **Integration Tests**: API endpoints, database operations
- **Accessibility**: ARIA labels, keyboard navigation
- **Edge Cases**: Error handling, validation, boundary conditions

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Deployment

### Deploy to Vercel

The easiest way to deploy GridPlay is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/yourusername/GridPlay)

### Manual Deployment

1. Build the production version:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Environment Variables

Ensure these environment variables are set in your deployment:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Project Structure

```
gridplay/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
│   ├── __tests__/         # Component unit tests
│   ├── Button.tsx         # Button component
│   ├── GridCell.tsx       # Grid cell component
│   ├── GameBoard.tsx      # Game board component
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── __tests__/         # Hook unit tests
│   ├── useTimer.ts        # Timer hook
│   ├── useGameBoard.ts    # Game board logic hook
│   └── ...
├── pages/                  # Next.js Pages Router
│   ├── api/               # API routes
│   │   ├── __tests__/    # API integration tests
│   │   └── games/        # Games API endpoints
│   └── ...
├── lib/                    # Utility libraries
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── public/                 # Static assets
└── examples/               # HTML prototypes (reference only)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.io/)
- UI components with [Chakra UI](https://chakra-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
