# Smart Waste Scanner ♻️

The **Smart Waste Scanner** is an AI-powered application designed to help users correctly sort their waste. By simply taking a photo of an item, the app identifies it, categorizes it into the correct bin (Recycle, Organic, Hazardous, etc.), and rewards users with eco-points.

## 🌟 Features

- **📸 AI Waste Recognition**: Instantly identifies waste items and provides disposal tips using advanced AI (Google Gemini via Lovable Gateway).
- **🎮 Gamification System**:
  - **Points & Levels**: Earn points for every scan and level up as you contribute to a greener planet.
  - **Streaks**: Maintain daily streaks to boost your eco-rating.
  - **Badges**: Unlock unique badges for various achievements (e.g., "Organic Hero", "Recycle Master").
- **🏆 Leaderboard**: Compete with others to see who is the top eco-warrior.
- **👤 User Profiles**: Track your scan history, stats, and earned badges.
- **🔐 Flexible Authentication**: Sign up via email or try the app instantly with Guest Access.
- **📱 Responsive Design**: Built with a mobile-first approach for easy use on any device.

## 🛠️ Tech Stack

This project is built with a modern frontend stack and powered by Supabase.

- **Frontend**:
  - [React](https://react.dev/) - UI Library
  - [Vite](https://vitejs.dev/) - Build Tool
  - [TypeScript](https://www.typescriptlang.org/) - Type Safety
  - [Tailwind CSS](https://tailwindcss.com/) - Styling
  - [shadcn/ui](https://ui.shadcn.com/) - UI Components
  - [React Query](https://tanstack.com/query/latest) - Data Fetching
  - [Lucide React](https://lucide.dev/) - Icons

- **Backend & Services**:
  - [Supabase](https://supabase.com/) - Database, Authentication, and Edge Functions (for AI analysis).

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/alwin2134/Smart-Waste-Scanner.git
    cd smart-waste-helper
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Environment Setup**:
    Create a `.env` file in the root directory. You will need your Supabase credentials.

    ```env
    VITE_SUPABASE_PROJECT_ID=your_project_id
    VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
    VITE_SUPABASE_URL=your_supabase_url
    ```

    *Note: Ensure your Supabase project has the necessary tables (profiles, scan_history) and Edge Functions deployed.*

    **Edge Function Secrets**:
    You also need to set the `LOVABLE_API_KEY` in your Supabase Dashboard -> Edge Functions -> Secrets for the AI analysis to work.

4. **Run the development server**:

    ```bash
    npm run dev
    ```

5. **Open the app**:
    Visit `http://localhost:8080` (or the port shown in your terminal) to view the app.

## 📂 Project Structure

- `src/components`: Reusable UI components (Camera, WasteResult, ProfileHeader, etc.).
- `src/pages`: Main application pages (Index, Auth, NotFound).
- `src/contexts`: Context providers (AuthContext).
- `src/hooks`: Custom hooks (useProfile, useToast).
- `src/integrations`: Service integrations (Supabase client).
- `supabase`: Supabase configuration and edge functions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source.
