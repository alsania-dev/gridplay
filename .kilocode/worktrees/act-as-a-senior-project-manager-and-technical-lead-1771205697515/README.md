# GridPlay

"Your Grid. Their Game. Instant Glory."

Digital Sports Squares Made Easy, Fair, and Fun! Ready to revolutionize sports squares? Launch your GridPlay board today—no spreadsheets, no stress, just wins!

## Elevator Pitch

Tired of messy spreadsheets, cash piles, and manual score-checking for your sports squares game? GridPlay automates the classic sports betting experience, turning chaotic paper grids into sleek, real-time digital boards. Host or join games in seconds, buy squares securely, and let the app handle live scores, random number assignments, and instant payouts—perfect for Super Bowl parties, March Madness, or casual game nights!

## How It Works

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
   - Winnings go straight to users' wallets or bank accounts.

## Game Modes

1. **Shotgun Board (2-Row Quick Play)**
   - Top row = Halftime, Bottom row = Final Score.
   - Last digit of each teams score added wins (e.g., 23-17 → 3+7=10 → 0 wins).
   - Payout: 90% of the total pot for that row (Halftime and Final). Example: $1 per square pays $9 to halftime winner and $9 to final winner, house cut 10% ($2).

2. **Classic 10x10 & 5x5 Grids**
   - 10x10: Match column (home team) and row (visitors) digits for each quarter.
   - 5x5: Double digits per row/column for faster action.
   - Each square has a chance to win in all 4 quarters. Your square could win them all.
   - Payouts: 16% (Q1), 24% (halftime), 16% (Q3), 32% (final), 12% house.

## Core Features

- **Real-Time Updates**: Live scores, sold squares, and winners update automatically – you don't have to lift a finger!
- **Secure Payments**: PCI-compliant gateways (Stripe, PayPal) + crypto options.
- **Social Integration**: Invite friends to a board your playing, or make a private board for social events.
- **Mobile-First Design**: Play on any device—no app download needed.
- **Fair Randomization**: Transparent RNG for number assignments.
- **User Profiles**: Track wins, balance, and game history.
- **"Board Rooms"**: Chat rooms that square holders of the same board can chat together.

## Premium User Benefits

- Keep and adjust house cut and adjust payout percentage
- Customizable board designs, including branded themes, logos, team colors and more.
- Multi-board management
- Personalized alerts (squares left needing to sell before game starts, board sells out, etc.)
- Access to beta features (early access to upcoming tools or enhancements, such as new game modes or integrations with additional sports data feeds.)

## Why Users Love It

- **Zero Hassle**: No cash, paper, or math—just pure fun.
- **Equal Chance**: Luck-based (no sports knowledge needed).
- **Social Buzz**: Perfect for watch parties, bars, or online groups.
- **Instant Payouts**: No waiting for hosts to Venmo you.

## Use Cases

- **Super Bowl, NBA Championship, Finals, March Madness, college, and other sports events**: Fill boards in minutes.
- **Group Events/Parties**: Social gatherings such as office parties, family reunions, or informal meet-ups
- **Bars/Restaurant/Event Hosts**: Looking to draw in, retain, and engage customers during live sports games.
- **Virtual Watch-Alongs**: Remote friends can play together.
- **Influencers/Content Creators/Streamers**: Host branded games for audiences.

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe, PayPal
- **State Management**: Recoil
- **APIs**: ESPN API for live scores
- **Testing**: Jest, Playwright

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Supabase account
- Stripe account (for payments)
- PayPal Developer account (for PayPal payments)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GridPlay.git
   cd GridPlay
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for server-side operations | Yes (for payments) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side | Yes (for payments) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes (for webhooks) |
| `PAYPAL_CLIENT_ID` | PayPal client ID | Yes (for PayPal) |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | Yes (for PayPal) |
| `ESPN_API_KEY` | ESPN API key for live scores | Optional |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

---

## Database Setup

The application uses Supabase for the database. Run the migrations in the `supabase/migrations/` directory to set up the required tables:

1. Create a new Supabase project
2. Go to the SQL Editor
3. Run the migration files in order

### Database Schema

- `users` - User profiles and settings
- `boards` - Game boards
- `board_squares` - Individual squares on boards
- `transactions` - Payment transactions
- `payouts` - Winner payouts

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/yourusername/GridPlay)

### Docker

```bash
# Build the image
docker build -t gridplay .

# Run the container
docker run -p 3000:3000 gridplay
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npx playwright test --ui
```

---

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── board/             # Board pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility libraries
│   ├── state/             # Recoil state
│   └── types/             # TypeScript types
├── e2e/                   # Playwright E2E tests
├── public/                # Static assets
├── supabase/              # Supabase migrations
└── tests/                 # Jest unit tests
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support, please open an issue on GitHub or contact support@gridplay.com
